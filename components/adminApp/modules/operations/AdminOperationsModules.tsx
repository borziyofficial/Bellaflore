"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  AdminCustomerOrder,
  AdminCustomerSummary,
  AdminNotification,
  AdminPromotion,
} from "@/lib/adminOperationsDb";
import { formatOrderDate, formatOrderPrice, orderStatusLabels } from "@/lib/orders/adminClient";
import { AdminModuleHeader, AdminPanel, AdminStatCard } from "@/components/adminApp/shared/AdminModuleUi";
import ui from "@/components/adminApp/shared/AdminModuleUi.module.css";
import styles from "@/components/adminApp/modules/operations/AdminOperationsModules.module.css";

type Category = {
  id: string;
  slug: string;
  title: string;
  icon: string;
  isActive: boolean;
  isCustom: boolean;
  usageCount: number;
};

type Analytics = {
  rangeDays: 1 | 7 | 30;
  orderCount: number;
  revenue: number;
  averageOrder: number;
  newCount: number;
  confirmedCount: number;
  cancelledCount: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    status: keyof typeof orderStatusLabels;
    total: number;
    createdAt: string;
  }>;
};

type StoreProfile = {
  storeName: string;
  storePhone: string;
  storeEmail: string;
  storeTelegram: string;
  storeWhatsapp: string;
  storeAddress: string;
};

const EMPTY_STORE: StoreProfile = {
  storeName: "",
  storePhone: "",
  storeEmail: "",
  storeTelegram: "",
  storeWhatsapp: "",
  storeAddress: "",
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
    ...init,
    headers: init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
  });
  const body = (await response.json().catch(() => null)) as (T & { message?: string }) | null;
  if (!response.ok || !body) throw new Error(body?.message || "Не удалось выполнить запрос.");
  return body;
}

function Notice({ value }: { value: { tone: "success" | "error"; text: string } | null }) {
  return value ? <p className={value.tone === "success" ? styles.success : styles.error}>{value.text}</p> : null;
}

export function AdminCategoriesModule() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const body = await requestJson<{ categories: Category[] }>("/api/admin/categories");
      setCategories(body.categories);
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Ошибка загрузки." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  async function createCategory() {
    if (!title.trim()) return;
    setBusyId("new");
    setNotice(null);
    try {
      await requestJson("/api/admin/categories", { method: "POST", body: JSON.stringify({ title }) });
      setTitle("");
      setNotice({ tone: "success", text: "Категория создана." });
      await load();
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Ошибка создания." });
    } finally { setBusyId(null); }
  }

  async function updateCategory(id: string, patch: { title?: string; isActive?: boolean }) {
    setBusyId(id);
    setNotice(null);
    try {
      await requestJson(`/api/admin/categories/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(patch),
      });
      setEditingId(null);
      setNotice({ tone: "success", text: "Категория обновлена." });
      await load();
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Ошибка обновления." });
    } finally { setBusyId(null); }
  }

  async function removeCategory(category: Category) {
    if (category.usageCount > 0 || !window.confirm(`Удалить категорию «${category.title}»?`)) return;
    setBusyId(category.id);
    setNotice(null);
    try {
      await requestJson(`/api/admin/categories/${encodeURIComponent(category.id)}`, { method: "DELETE" });
      setNotice({ tone: "success", text: "Категория удалена." });
      await load();
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Ошибка удаления." });
    } finally { setBusyId(null); }
  }

  return <div className={ui.stack}>
    <AdminModuleHeader title="Категории" subtitle="Реальные категории витрины и безопасное управление пользовательскими категориями" />
    <Notice value={notice} />
    <AdminPanel title="Новая категория">
      <div className={styles.inlineForm}>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Название категории" />
        <button className={styles.primaryButton} type="button" disabled={!title.trim() || busyId === "new"} onClick={() => void createCategory()}>{busyId === "new" ? "Создание…" : "Создать"}</button>
      </div>
    </AdminPanel>
    <AdminPanel title={loading ? "Загружаем категории…" : `Категории (${categories.length})`}>
      <div className={styles.cardList}>
        {categories.map((category) => <article className={styles.rowCard} key={category.id}>
          <div className={styles.rowMain}>
            <span className={styles.categoryIcon}>{category.icon}</span>
            <div>
              {editingId === category.id ? <input value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} aria-label="Название категории" /> : <strong>{category.title}</strong>}
              <p>{category.slug} · {category.usageCount} товар(ов) · {category.isCustom ? "Пользовательская" : "Системная"}</p>
            </div>
          </div>
          <div className={styles.actions}>
            <span className={category.isActive ? styles.activeBadge : styles.inactiveBadge}>{category.isActive ? "Включена" : "Выключена"}</span>
            {category.isCustom ? <>
              {editingId === category.id ? <button type="button" onClick={() => void updateCategory(category.id, { title: editingTitle })} disabled={!editingTitle.trim() || busyId === category.id}>Сохранить</button> : <button type="button" onClick={() => { setEditingId(category.id); setEditingTitle(category.title); }}>Изменить</button>}
              <button type="button" onClick={() => void updateCategory(category.id, { isActive: !category.isActive })} disabled={busyId === category.id}>{category.isActive ? "Выключить" : "Включить"}</button>
              <button className={styles.dangerButton} type="button" onClick={() => void removeCategory(category)} disabled={busyId === category.id || category.usageCount > 0} title={category.usageCount > 0 ? "Категория используется товарами" : "Удалить категорию"}>Удалить</button>
            </> : <span className={styles.muted}>Защищена каталогом</span>}
          </div>
        </article>)}
      </div>
    </AdminPanel>
  </div>;
}

export function AdminCustomersModule() {
  const [customers, setCustomers] = useState<AdminCustomerSummary[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminCustomerSummary | null>(null);
  const [orders, setOrders] = useState<AdminCustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    requestJson<{ customers: AdminCustomerSummary[] }>("/api/admin/customers")
      .then((body) => setCustomers(body.customers))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Ошибка загрузки."))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    const digits = search.replace(/\D/g, "");
    return customers.filter((customer) => !query || customer.name.toLowerCase().includes(query) || (digits && customer.phone.replace(/\D/g, "").includes(digits)));
  }, [customers, search]);

  async function openCustomer(customer: AdminCustomerSummary) {
    setSelected(customer);
    setOrders([]);
    try {
      const body = await requestJson<{ orders: AdminCustomerOrder[] }>(`/api/admin/customers?phone=${encodeURIComponent(customer.phone)}`);
      setOrders(body.orders);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Ошибка загрузки истории."); }
  }

  return <div className={ui.stack}>
    <AdminModuleHeader title="Клиенты" subtitle="CRM только из реальных заказов — без отдельных или тестовых клиентов" />
    <div className={ui.statGrid}>
      <AdminStatCard label="Клиентов" value={String(customers.length)} hint="Уникальные телефоны" />
      <AdminStatCard label="Заказов" value={String(customers.reduce((sum, item) => sum + item.orderCount, 0))} />
      <AdminStatCard label="Выручка" value={formatOrderPrice(customers.reduce((sum, item) => sum + item.totalSpent, 0))} hint="Без отменённых" />
    </div>
    {error ? <p className={styles.error}>{error}</p> : null}
    <AdminPanel title="Поиск">
      <input className={styles.fullInput} type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Имя или телефон" />
    </AdminPanel>
    <AdminPanel title={loading ? "Загружаем клиентов…" : `Клиенты (${visible.length})`}>
      {!loading && visible.length === 0 ? <div className={ui.emptyZone}>Клиенты не найдены.</div> : <div className={styles.cardList}>{visible.map((customer) => <button className={styles.customerCard} type="button" key={customer.phone} onClick={() => void openCustomer(customer)}>
        <span><strong>{customer.name}</strong><small>{customer.phone}</small></span>
        <span><strong>{customer.orderCount} заказ(ов)</strong><small>{formatOrderPrice(customer.totalSpent)}</small></span>
        <span><small>Последний заказ</small><strong>{formatOrderDate(customer.lastOrderAt)}</strong></span>
      </button>)}</div>}
    </AdminPanel>
    {selected ? <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setSelected(null)}><section className={styles.modal} role="dialog" aria-modal="true" aria-label={`Карточка клиента ${selected.name}`} onMouseDown={(event) => event.stopPropagation()}>
      <div className={styles.modalHeader}><div><p className={styles.eyebrow}>Карточка клиента</p><h3>{selected.name}</h3><p>{selected.phone}</p></div><button type="button" onClick={() => setSelected(null)}>Закрыть</button></div>
      <div className={styles.cardList}>{orders.map((order) => <Link className={styles.orderRow} href={`/admin/orders/${encodeURIComponent(order.id)}`} key={order.id}><span><strong>{order.orderNumber}</strong><small>{formatOrderDate(order.createdAt)}</small></span><span>{orderStatusLabels[order.status]}</span><strong>{formatOrderPrice(order.total)}</strong></Link>)}</div>
      {orders.length === 0 ? <p className={styles.muted}>Загрузка истории…</p> : null}
    </section></div> : null}
  </div>;
}

function localDateTime(value: string): string {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

const newPromotion = (): Omit<AdminPromotion, "id" | "createdAt" | "updatedAt"> => {
  const start = new Date();
  const end = new Date(start.getTime() + 7 * 86400000);
  return { title: "", description: "", discountType: "percent", discountValue: 10, startsAt: localDateTime(start.toISOString()), endsAt: localDateTime(end.toISOString()), isActive: false };
};

export function AdminPromotionsModule() {
  const [promotions, setPromotions] = useState<AdminPromotion[]>([]);
  const [form, setForm] = useState(newPromotion());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function load() {
    try { setPromotions((await requestJson<{ promotions: AdminPromotion[] }>("/api/admin/promotions")).promotions); }
    catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Ошибка загрузки." }); }
  }
  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  async function save() {
    setSaving(true); setNotice(null);
    const endpoint = editingId ? `/api/admin/promotions/${encodeURIComponent(editingId)}` : "/api/admin/promotions";
    try {
      await requestJson(endpoint, { method: editingId ? "PUT" : "POST", body: JSON.stringify({ ...form, startsAt: new Date(form.startsAt).toISOString(), endsAt: new Date(form.endsAt).toISOString() }) });
      setForm(newPromotion()); setEditingId(null);
      setNotice({ tone: "success", text: "Акция сохранена. Checkout пока её не применяет." });
      await load();
    } catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Ошибка сохранения." }); }
    finally { setSaving(false); }
  }

  function edit(item: AdminPromotion) {
    setEditingId(item.id);
    setForm({ title: item.title, description: item.description, discountType: item.discountType, discountValue: item.discountValue, startsAt: localDateTime(item.startsAt), endsAt: localDateTime(item.endsAt), isActive: item.isActive });
  }

  async function remove(id: string) {
    if (!window.confirm("Удалить акцию?")) return;
    try { await requestJson(`/api/admin/promotions/${encodeURIComponent(id)}`, { method: "DELETE" }); await load(); }
    catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Ошибка удаления." }); }
  }

  return <div className={ui.stack}>
    <AdminModuleHeader title="Акции" subtitle="Безопасный admin CRUD; применение скидок в checkout пока не подключено" />
    <p className={styles.warning}>Integration pending: активность здесь не меняет цену заказа и не затрагивает checkout.</p>
    <Notice value={notice} />
    <AdminPanel title={editingId ? "Редактирование акции" : "Новая акция"}>
      <div className={styles.formGrid}>
        <label><span>Название</span><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
        <label><span>Тип скидки</span><select value={form.discountType} onChange={(event) => setForm({ ...form, discountType: event.target.value as "fixed" | "percent" })}><option value="percent">Проценты (%)</option><option value="fixed">Сумма (₽)</option></select></label>
        <label><span>Значение</span><input type="number" min="1" max={form.discountType === "percent" ? 100 : undefined} value={form.discountValue} onChange={(event) => setForm({ ...form, discountValue: Number(event.target.value) })} /></label>
        <label><span>Начало</span><input type="datetime-local" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /></label>
        <label><span>Окончание</span><input type="datetime-local" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} /></label>
        <label className={styles.checkbox}><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /><span>Активна в admin</span></label>
        <label className={styles.fullField}><span>Описание</span><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
      </div>
      <div className={styles.actions}><button className={styles.primaryButton} type="button" disabled={saving || !form.title.trim()} onClick={() => void save()}>{saving ? "Сохранение…" : "Сохранить"}</button>{editingId ? <button type="button" onClick={() => { setEditingId(null); setForm(newPromotion()); }}>Отмена</button> : null}</div>
    </AdminPanel>
    <AdminPanel title={`Акции (${promotions.length})`}><div className={styles.cardList}>{promotions.map((item) => <article className={styles.rowCard} key={item.id}><div><strong>{item.title}</strong><p>{item.description || "Без описания"}</p><p>{formatOrderPrice(item.discountValue).replace(" ₽", item.discountType === "percent" ? "%" : " ₽")} · {formatOrderDate(item.startsAt)} — {formatOrderDate(item.endsAt)}</p></div><div className={styles.actions}><span className={item.isActive ? styles.activeBadge : styles.inactiveBadge}>{item.isActive ? "Активна" : "Неактивна"}</span><button type="button" onClick={() => edit(item)}>Изменить</button><button className={styles.dangerButton} type="button" onClick={() => void remove(item.id)}>Удалить</button></div></article>)}</div>{promotions.length === 0 ? <div className={ui.emptyZone}>Акций пока нет.</div> : null}</AdminPanel>
  </div>;
}

export function AdminAnalyticsModule() {
  const [days, setDays] = useState<1 | 7 | 30>(7);
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setData(null);
      setError("");
      requestJson<{ analytics: Analytics }>(`/api/admin/analytics?days=${days}`)
        .then((body) => setData(body.analytics))
        .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Ошибка загрузки."));
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [days]);
  return <div className={ui.stack}>
    <AdminModuleHeader title="Аналитика" subtitle="Расчёты напрямую по реальным заказам" />
    <div className={ui.tabRow}>{([{ value: 1, label: "Сегодня" }, { value: 7, label: "7 дней" }, { value: 30, label: "30 дней" }] as const).map((item) => <button type="button" className={`${ui.tabChip} ${days === item.value ? ui.tabChipActive : ""}`} key={item.value} onClick={() => setDays(item.value)}>{item.label}</button>)}</div>
    {error ? <p className={styles.error}>{error}</p> : null}
    <div className={ui.statGrid}><AdminStatCard label="Заказы" value={data ? String(data.orderCount) : "—"} /><AdminStatCard label="Выручка" value={data ? formatOrderPrice(data.revenue) : "—"} hint="Без отменённых" /><AdminStatCard label="Средний чек" value={data ? formatOrderPrice(Math.round(data.averageOrder)) : "—"} /><AdminStatCard label="Новые" value={data ? String(data.newCount) : "—"} /></div>
    <div className={ui.statGrid}><AdminStatCard label="Подтверждённые" value={data ? String(data.confirmedCount) : "—"} /><AdminStatCard label="Отменённые" value={data ? String(data.cancelledCount) : "—"} /></div>
    <AdminPanel title="Последние заказы периода"><div className={styles.cardList}>{data?.recentOrders.map((order) => <Link className={styles.orderRow} href={`/admin/orders/${encodeURIComponent(order.id)}`} key={order.id}><span><strong>{order.orderNumber}</strong><small>{order.customerName} · {formatOrderDate(order.createdAt)}</small></span><span>{orderStatusLabels[order.status]}</span><strong>{formatOrderPrice(order.total)}</strong></Link>)}</div>{data && data.recentOrders.length === 0 ? <div className={ui.emptyZone}>В этом периоде заказов нет.</div> : null}</AdminPanel>
  </div>;
}

export function AdminNotificationsModule() {
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load() {
    setLoading(true);
    try { setItems((await requestJson<{ notifications: AdminNotification[] }>("/api/admin/notifications")).notifications); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Ошибка загрузки."); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);
  async function markRead(item: AdminNotification) {
    if (item.read) return;
    try { await requestJson("/api/admin/notifications", { method: "POST", body: JSON.stringify({ id: item.id }) }); setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Ошибка обновления."); }
  }
  const unread = items.filter((item) => !item.read).length;
  return <div className={ui.stack}>
    <AdminModuleHeader title="Уведомления" subtitle="Внутренние события, сформированные только из реальных заказов" action={<span className={styles.counter}>{unread} непрочитано</span>} />
    <p className={styles.info}>Новые и отменённые заказы отображаются автоматически. Отдельный журнал серверных ошибок пока не подключён.</p>
    {error ? <p className={styles.error}>{error}</p> : null}
    <AdminPanel title={loading ? "Загружаем события…" : `События (${items.length})`}><div className={styles.cardList}>{items.map((item) => <article className={`${styles.notificationCard} ${!item.read ? styles.notificationUnread : ""}`} key={item.id}><button type="button" onClick={() => void markRead(item)}><span><strong>{item.title}</strong><small>{item.message} · {formatOrderDate(item.createdAt)}</small></span><span className={item.severity === "important" ? styles.importantBadge : styles.activeBadge}>{item.read ? "Прочитано" : "Непрочитано"}</span></button><Link href={`/admin/orders/${encodeURIComponent(item.orderId)}`}>Открыть заказ</Link></article>)}</div>{!loading && items.length === 0 ? <div className={ui.emptyZone}>Событий пока нет.</div> : null}</AdminPanel>
  </div>;
}

export function AdminAutomationModule() {
  return <div className={ui.stack}>
    <AdminModuleHeader title="Автоматизация" subtitle="Контроль будущих правил без имитации работающих интеграций" />
    <div className={ui.statGrid}><AdminStatCard label="Активные правила" value="0" hint="Server backend не подключён" /><AdminStatCard label="Отправки" value="0" hint="Автоотправка отключена" /></div>
    <p className={styles.warning}>Серверный исполнитель автоматизаций отсутствует. Страница ничего не отправляет и не изменяет заказы.</p>
    <AdminPanel title="Правила"><div className={styles.automationGrid}><article><strong>Триггер</strong><p>Событие заказа или расписание</p></article><article><strong>Условия</strong><p>Статус, сумма, дата и сегмент</p></article><article><strong>Действие</strong><p>Только после подключения проверенного канала</p></article></div><button className={styles.disabledButton} type="button" disabled>Создание правил станет доступно после backend-интеграции</button></AdminPanel>
    <AdminPanel title="Существующие автоматизации"><div className={ui.emptyZone}>Серверные автоматизации не найдены. Локальные демонстрационные workflow не показаны как реальные.</div></AdminPanel>
  </div>;
}

export function AdminSettingsModule() {
  const [profile, setProfile] = useState<StoreProfile>(EMPTY_STORE);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  useEffect(() => {
    requestJson<{ profile: StoreProfile }>("/api/admin/profile")
      .then((body) => setProfile(body.profile))
      .catch((error: unknown) => setNotice({ tone: "error", text: error instanceof Error ? error.message : "Ошибка загрузки." }))
      .finally(() => setReady(true));
  }, []);
  async function save() {
    setSaving(true); setNotice(null);
    try {
      const body = await requestJson<{ profile: StoreProfile }>("/api/admin/profile", { method: "PUT", body: JSON.stringify({ profile }) });
      setProfile(body.profile); setNotice({ tone: "success", text: "Настройки магазина сохранены." });
    } catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Ошибка сохранения." }); }
    finally { setSaving(false); }
  }
  const field = (key: keyof StoreProfile, label: string, placeholder: string) => <label><span>{label}</span><input value={profile[key]} onChange={(event) => setProfile({ ...profile, [key]: event.target.value })} placeholder={placeholder} /></label>;
  return <div className={ui.stack}>
    <AdminModuleHeader title="Настройки" subtitle="Поддерживаемые публичные данные магазина — без секретов и инфраструктуры" />
    <Notice value={notice} />
    <AdminPanel title={ready ? "Основные данные магазина" : "Загружаем настройки…"}><div className={styles.formGrid}>{field("storeName", "Название", "BellaFlore")}{field("storePhone", "Телефон", "+7 …")}{field("storeEmail", "Email", "info@bellaflore.ru")}{field("storeTelegram", "Telegram", "@bellaflore")}{field("storeWhatsapp", "WhatsApp", "+7 …")}{field("storeAddress", "Адрес", "Москва, …")}</div><button className={styles.primaryButton} type="button" disabled={!ready || saving} onClick={() => void save()}>{saving ? "Сохранение…" : "Сохранить настройки"}</button></AdminPanel>
    <AdminPanel title="Безопасность"><p className={styles.muted}>Секретные и инфраструктурные параметры намеренно остаются вне интерфейса администратора.</p></AdminPanel>
  </div>;
}
