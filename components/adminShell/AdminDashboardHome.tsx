// ==================================================
// SECTION: Admin Shell — dashboard home
// РАЗДЕЛ: Главный экран активного модуля
// ==================================================
"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  getNewOrdersCount,
  getTodayOrdersCount,
  getTodayRevenue,
} from "@/components/admin/adminDashboardMetrics";
import { getAllOrders } from "@/components/admin/adminOrderList";
import {
  adminUserFromSecuritySession,
  getAdminEntrySession,
} from "@/components/adminEntry/adminEntryAuth";
import { BELLAFLORE_MODULE_SECTIONS } from "@/components/adminShell/adminModules";
import styles from "@/components/adminShell/AdminDashboardHome.module.css";

type AdminDashboardHomeProps = {
  activeModuleId?: unknown;
};

type DashboardIconName =
  | "bell"
  | "orders"
  | "revenue"
  | "products"
  | "delivery"
  | "clients"
  | "spark"
  | "chevron"
  | "arrow";

type QuickAction = {
  id: string;
  label: string;
  hint: string;
  href: string;
  icon: DashboardIconName;
  bentoClass: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "new-product",
    label: "Новый товар",
    hint: "Создать букет",
    href: "/admin/products",
    icon: "spark",
    bentoClass: "bentoActionHero",
  },
  {
    id: "orders",
    label: "Заказы",
    hint: "Статусы",
    href: "/admin/orders",
    icon: "orders",
    bentoClass: "bentoActionCompact",
  },
  {
    id: "delivery",
    label: "Доставка",
    hint: "Маршруты",
    href: "/admin/delivery",
    icon: "delivery",
    bentoClass: "bentoActionCompact",
  },
  {
    id: "customers",
    label: "Клиенты",
    hint: "CRM",
    href: "/admin/crm/clients",
    icon: "clients",
    bentoClass: "bentoActionWide",
  },
];

function DashboardIcon({
  name,
  className,
}: {
  name: DashboardIconName;
  className?: string;
}) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true as const,
  };

  switch (name) {
    case "bell":
      return (
        <svg {...common}>
          <path
            d="M12 4.2c2.2 0 4 1.8 4 4v2.4l1.4 2.4H6.6L8 10.6V8.2c0-2.2 1.8-4 4-4Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M10.2 18.2a1.8 1.8 0 0 0 3.6 0"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "orders":
      return (
        <svg {...common}>
          <rect
            x="5"
            y="6"
            width="14"
            height="12"
            rx="3"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M9 10h6M9 13.5h4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "revenue":
      return (
        <svg {...common}>
          <path
            d="M6 17V9.5M12 17V7M18 17v-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M5 17h14"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "products":
      return (
        <svg {...common}>
          <path
            d="M12 5.5c2.4 1.4 4 3.2 4 5.2S14.4 15 12 16.5C9.6 15 8 13.2 8 10.7S9.6 6.9 12 5.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M12 16.5V19"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "delivery":
      return (
        <svg {...common}>
          <path
            d="M4.5 14.5h11l2.5-3.5V8H6.5L4.5 10.5v4Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <circle cx="8" cy="16.5" r="1.5" fill="currentColor" />
          <circle cx="15.5" cy="16.5" r="1.5" fill="currentColor" />
        </svg>
      );
    case "clients":
      return (
        <svg {...common}>
          <circle cx="12" cy="9" r="3" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M6.5 18.5c.8-2.6 2.8-4 5.5-4s4.7 1.4 5.5 4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "spark":
      return (
        <svg {...common}>
          <path
            d="M12 4.5 13.8 10l5.7 1.2-4.5 3.6 1.4 5.7L12 17.8 7.6 20.5 9 14.8 4.5 11.2 10.2 10 12 4.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "chevron":
      return (
        <svg {...common}>
          <path
            d="m10 8 4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "arrow":
      return (
        <svg {...common}>
          <path
            d="M7 12h10M13 8l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

function getGreetingLabel(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Доброе утро";
  }

  if (hour < 18) {
    return "Добрый день";
  }

  return "Добрый вечер";
}

function getTodayLabel(): string {
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date());
}

function formatRevenue(value: number): string {
  if (value <= 0) {
    return "0 ₽";
  }

  return `${Math.round(value).toLocaleString("ru-RU")} ₽`;
}

function formatRelativeTime(isoDate: string): string {
  const createdAt = new Date(isoDate).getTime();

  if (Number.isNaN(createdAt)) {
    return "недавно";
  }

  const diffMinutes = Math.max(
    1,
    Math.round((Date.now() - createdAt) / (1000 * 60)),
  );

  if (diffMinutes < 60) {
    return `${diffMinutes} мин`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} ч`;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(new Date(isoDate));
}

function buildRecentActivity() {
  return getAllOrders()
    .slice(0, 3)
    .map((order) => ({
      id: order.orderId,
      title: order.customerName || "Новый заказ",
      meta: `${order.totalPriceRub.toLocaleString("ru-RU")} ₽ · ${order.status}`,
      time: formatRelativeTime(order.createdAt),
      href: "/admin/orders",
    }));
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function AdminDashboardHome({}: AdminDashboardHomeProps = {}) {
  const isClient = useIsClient();
  const session = isClient ? getAdminEntrySession() : null;
  const greeting = isClient ? getGreetingLabel() : "Добрый день";
  const todayLabel = isClient ? getTodayLabel() : "";
  const todayOrders = isClient ? getTodayOrdersCount() : 0;
  const todayRevenue = isClient ? getTodayRevenue() : 0;
  const newOrders = isClient ? getNewOrdersCount() : 0;
  const recentActivity = isClient ? buildRecentActivity() : [];

  const adminUser = session ? adminUserFromSecuritySession(session) : null;
  const displayName = adminUser?.adminUserName ?? session?.userName ?? "Admin";
  const profileInitial = displayName.trim().charAt(0).toUpperCase() || "A";
  const firstName = displayName.trim().split(/\s+/)[0] ?? displayName;

  const orderStatusLabel =
    newOrders > 0
      ? `${newOrders} новых заказов`
      : todayOrders > 0
        ? "Все заказы в обработке"
        : "Нет новых заказов";

  const deliverySection = BELLAFLORE_MODULE_SECTIONS.find(
    (section) => section.id === "delivery",
  );
  const clientsSection = BELLAFLORE_MODULE_SECTIONS.find(
    (section) => section.id === "clients",
  );

  return (
    <div className={styles.dashboard}>
      <header className={styles.topRow}>
        <div className={styles.greetingBlock}>
          <p className={styles.greetingLine}>
            <span className={styles.greetingSoft}>{greeting},</span>
            <span className={styles.greetingName}>{firstName}</span>
          </p>
          {todayLabel ? <p className={styles.dateLine}>{todayLabel}</p> : null}
        </div>

        <div className={styles.topActions}>
          <button
            type="button"
            className={styles.notifButton}
            aria-label={`Уведомления${newOrders > 0 ? `: ${newOrders} новых` : ""}`}
          >
            <DashboardIcon name="bell" className={styles.notifIconSvg} />
            {newOrders > 0 ? (
              <span className={styles.notifBadge}>{newOrders}</span>
            ) : null}
          </button>

          <div className={styles.profileChip} aria-label={`Профиль ${displayName}`}>
            <span className={styles.profileAvatar}>{profileInitial}</span>
          </div>
        </div>
      </header>

      <section className={styles.bentoMain} aria-label="Сводка дня">
        <Link href="/admin/orders" className={styles.featuredBento}>
          <span className={styles.featuredSheen} aria-hidden="true" />
          <span className={styles.featuredGlow} aria-hidden="true" />

          <div className={styles.featuredTop}>
            <span className={styles.featuredKicker}>Заказы сегодня</span>
            <span className={styles.featuredArrowWrap} aria-hidden="true">
              <DashboardIcon name="arrow" className={styles.featuredArrow} />
            </span>
          </div>

          <strong className={styles.featuredNumber}>
            {todayOrders.toLocaleString("ru-RU")}
          </strong>

          <div className={styles.featuredMeta}>
            <div className={styles.featuredRevenueBlock}>
              <span className={styles.featuredMetaLabel}>Выручка</span>
              <span className={styles.featuredMetaValue}>
                {formatRevenue(todayRevenue)}
              </span>
            </div>
            <p className={styles.featuredStatus}>{orderStatusLabel}</p>
          </div>
        </Link>

        <div className={styles.sideColumn}>
          <article className={`${styles.sideTile} ${styles.sideTileRevenue}`}>
            <span className={styles.sideTileIconWrap}>
              <DashboardIcon name="revenue" className={styles.sideTileIcon} />
            </span>
            <span className={styles.sideTileLabel}>Выручка</span>
            <strong className={styles.sideTileValue}>
              {formatRevenue(todayRevenue)}
            </strong>
          </article>

          <Link href="/admin/products" className={`${styles.sideTile} ${styles.sideTileProducts}`}>
            <span className={styles.sideTileIconWrap}>
              <DashboardIcon name="products" className={styles.sideTileIcon} />
            </span>
            <span className={styles.sideTileLabel}>Товары</span>
            <strong className={styles.sideTileValue}>Каталог</strong>
            <span className={styles.sideTileHint}>управление</span>
          </Link>
        </div>
      </section>

      <section className={styles.moduleBento} aria-label="Разделы">
        {deliverySection ? (
          <Link
            href={deliverySection.href!}
            className={`${styles.moduleTile} ${styles.moduleTileDelivery}`}
          >
            <DashboardIcon name="delivery" className={styles.moduleTileIcon} />
            <span className={styles.moduleTileBody}>
              <strong>{deliverySection.title}</strong>
              <span>{deliverySection.description}</span>
            </span>
          </Link>
        ) : null}

        {clientsSection ? (
          <Link
            href={clientsSection.href!}
            className={`${styles.moduleTile} ${styles.moduleTileClients}`}
          >
            <DashboardIcon name="clients" className={styles.moduleTileIcon} />
            <span className={styles.moduleTileBody}>
              <strong>{clientsSection.title}</strong>
              <span>{clientsSection.description}</span>
            </span>
          </Link>
        ) : null}
      </section>

      <section className={styles.actionsBento} aria-label="Быстрые действия">
        <h3 className={styles.sectionEyebrow}>Быстрые действия</h3>

        <div className={styles.actionsBentoGrid}>
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              className={`${styles.bentoAction} ${styles[action.bentoClass as keyof typeof styles]}`}
            >
              {action.id === "new-product" ? (
                <span className={styles.bentoActionGlow} aria-hidden="true" />
              ) : null}
              <span className={styles.bentoActionIconWrap}>
                <DashboardIcon
                  name={action.icon}
                  className={styles.bentoActionIcon}
                />
              </span>
              <span className={styles.bentoActionCopy}>
                <strong>{action.label}</strong>
                <span>{action.hint}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.timeline} aria-label="Недавняя активность">
        <div className={styles.timelineHead}>
          <h3 className={styles.sectionEyebrow}>Недавняя активность</h3>
          <Link href="/admin/orders" className={styles.timelineLink}>
            Все
            <DashboardIcon name="chevron" className={styles.timelineLinkIcon} />
          </Link>
        </div>

        {recentActivity.length > 0 ? (
          <ul className={styles.timelineList}>
            {recentActivity.map((item, index) => (
              <li key={item.id} className={styles.timelineItem}>
                <span
                  className={styles.timelineRail}
                  data-last={index === recentActivity.length - 1 ? true : undefined}
                  aria-hidden="true"
                />
                <Link href={item.href} className={styles.timelineRow}>
                  <span className={styles.timelineDot} aria-hidden="true" />
                  <span className={styles.timelineCopy}>
                    <strong>{item.title}</strong>
                    <span>{item.meta}</span>
                  </span>
                  <time className={styles.timelineTime}>{item.time}</time>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.timelineEmpty}>
            Пока нет активности — новые заказы появятся здесь.
          </p>
        )}
      </section>
    </div>
  );
}
