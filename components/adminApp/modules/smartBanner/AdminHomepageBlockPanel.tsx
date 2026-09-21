// ==================================================
// SECTION: ADMIN APP — Generic homepage content block control
// РАЗДЕЛ: Управление блоками главной страницы (Featured / Seasonal / CTA band)
// ==================================================
"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPanel } from "@/components/adminApp/shared/AdminModuleUi";
import type { HomepageBlock, HomepageBlockCard, HomepageBlockKind } from "@/lib/homepageBlocksTypes";
import styles from "@/components/adminApp/modules/smartBanner/AdminHomepageBlockPanel.module.css";

function createCardId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `card-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createEmptyCard(sortOrder: number): HomepageBlockCard {
  return {
    id: createCardId(),
    imageUrl: "",
    title: "",
    subtitle: "",
    buttonText: "",
    buttonLink: "",
    isEnabled: true,
    sortOrder,
  };
}

export function AdminHomepageBlockPanel({
  kind,
  panelTitle,
  description,
  showCards = true,
  showCta = false,
}: {
  kind: HomepageBlockKind;
  panelTitle: string;
  description: string;
  showCards?: boolean;
  showCta?: boolean;
}) {
  const [block, setBlock] = useState<HomepageBlock | null>(null);
  const [draft, setDraft] = useState<HomepageBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    fetch(`/api/admin/homepage-blocks/${kind}`, {
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as { block?: HomepageBlock; message?: string };
        if (!response.ok || !body.block) {
          throw new Error(body.message || "Не удалось загрузить блок.");
        }
        return body.block;
      })
      .then((loaded) => {
        if (!active) return;
        setBlock(loaded);
        setDraft(loaded);
      })
      .catch((error) => {
        if (!active || controller.signal.aborted) return;
        setNotice({
          tone: "error",
          text: error instanceof Error ? error.message : "Не удалось загрузить блок.",
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [kind]);

  const hasChanges = useMemo(() => {
    if (!block || !draft) return false;
    return JSON.stringify(block) !== JSON.stringify(draft);
  }, [block, draft]);

  const patchDraft = (patch: Partial<HomepageBlock>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  };

  const patchCard = (id: string, patch: Partial<HomepageBlockCard>) => {
    setDraft((current) =>
      current
        ? { ...current, cards: current.cards.map((card) => (card.id === id ? { ...card, ...patch } : card)) }
        : current,
    );
  };

  const addCard = () => {
    setDraft((current) =>
      current
        ? { ...current, cards: [...current.cards, createEmptyCard(current.cards.length)] }
        : current,
    );
  };

  const removeCard = (id: string) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            cards: current.cards
              .filter((card) => card.id !== id)
              .map((card, index) => ({ ...card, sortOrder: index })),
          }
        : current,
    );
  };

  const moveCard = (id: string, direction: -1 | 1) => {
    setDraft((current) => {
      if (!current) return current;
      const ordered = [...current.cards].sort((a, b) => a.sortOrder - b.sortOrder);
      const index = ordered.findIndex((card) => card.id === id);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) {
        return current;
      }
      const next = [...ordered];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return { ...current, cards: next.map((card, sortOrder) => ({ ...card, sortOrder })) };
    });
  };

  const uploadCardImage = async (cardId: string, file: File | undefined) => {
    if (!file) return;
    setUploadingId(cardId);
    setNotice(null);
    try {
      const formData = new FormData();
      formData.set("image", file);
      const response = await fetch(`/api/admin/homepage-blocks/${kind}/image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const body = (await response.json()) as { imageUrl?: string; message?: string };
      if (!response.ok || !body.imageUrl) {
        throw new Error(body.message || "Не удалось загрузить фото.");
      }
      patchCard(cardId, { imageUrl: body.imageUrl });
      setNotice({ tone: "success", text: "Фото загружено. Нажмите «Сохранить»." });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Не удалось загрузить фото.",
      });
    } finally {
      setUploadingId(null);
    }
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setNotice(null);
    try {
      const normalizedCards = [...draft.cards]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((card, sortOrder) => ({ ...card, sortOrder }));

      const response = await fetch(`/api/admin/homepage-blocks/${kind}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          block: {
            title: draft.title,
            subtitle: draft.subtitle,
            buttonText: draft.buttonText,
            buttonLink: draft.buttonLink,
            isEnabled: draft.isEnabled,
            cards: normalizedCards,
          },
        }),
      });
      const body = (await response.json()) as { block?: HomepageBlock; message?: string };
      if (!response.ok || !body.block) {
        throw new Error(body.message || "Не удалось сохранить блок.");
      }
      setBlock(body.block);
      setDraft(body.block);
      setNotice({ tone: "success", text: "Блок сохранён и опубликован на главной." });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Не удалось сохранить блок.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPanel title={panelTitle}>
      <div className={styles.headerCopy}>
        <strong>{description}</strong>
      </div>

      {notice ? <p className={styles[notice.tone]}>{notice.text}</p> : null}

      {loading || !draft ? (
        <div className={styles.loading}>Загрузка…</div>
      ) : (
        <>
          <div className={styles.statusRow}>
            <span>{draft.isEnabled ? "Показывается на главной" : "Скрыт на главной"}</span>
            <div className={styles.statusToggle} role="radiogroup" aria-label="Показ блока">
              <button
                type="button"
                role="radio"
                aria-checked={draft.isEnabled}
                onClick={() => patchDraft({ isEnabled: true })}
              >
                Вкл
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={!draft.isEnabled}
                onClick={() => patchDraft({ isEnabled: false })}
              >
                Выкл
              </button>
            </div>
          </div>

          <div className={styles.sectionFields}>
            <label>
              <span>Заголовок секции</span>
              <input value={draft.title} onChange={(event) => patchDraft({ title: event.target.value })} />
            </label>
            <label>
              <span>Подзаголовок секции</span>
              <textarea
                value={draft.subtitle}
                onChange={(event) => patchDraft({ subtitle: event.target.value })}
              />
            </label>
            {showCta ? (
              <>
                <label>
                  <span>Текст кнопки</span>
                  <input
                    value={draft.buttonText}
                    onChange={(event) => patchDraft({ buttonText: event.target.value })}
                  />
                </label>
                <label>
                  <span>Ссылка кнопки</span>
                  <input
                    value={draft.buttonLink}
                    onChange={(event) => patchDraft({ buttonLink: event.target.value })}
                    placeholder="/catalog"
                  />
                </label>
              </>
            ) : null}
          </div>

          {showCards ? (
            <>
              <div className={styles.list}>
                {[...draft.cards]
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((card, index, ordered) => (
                    <article className={styles.cardEditor} key={card.id}>
                      <div className={styles.cardTop}>
                        <div className={styles.preview}>
                          {card.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={card.imageUrl} alt="" />
                          ) : (
                            <span>Нет фото</span>
                          )}
                        </div>
                        <div className={styles.cardMeta}>
                          <strong>Карточка {index + 1}</strong>
                          <label className={styles.uploadButton}>
                            {uploadingId === card.id ? "Загрузка…" : "Загрузить фото"}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                              disabled={uploadingId !== null}
                              onChange={(event) => {
                                void uploadCardImage(card.id, event.target.files?.[0]);
                                event.target.value = "";
                              }}
                            />
                          </label>
                        </div>
                        <div className={styles.orderButtons}>
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveCard(card.id, -1)}
                            aria-label="Поднять"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            disabled={index === ordered.length - 1}
                            onClick={() => moveCard(card.id, 1)}
                            aria-label="Опустить"
                          >
                            ↓
                          </button>
                        </div>
                      </div>

                      <div className={styles.fields}>
                        <label>
                          <span>Заголовок</span>
                          <input
                            value={card.title}
                            onChange={(event) => patchCard(card.id, { title: event.target.value })}
                          />
                        </label>
                        <label>
                          <span>Подпись</span>
                          <input
                            value={card.subtitle}
                            onChange={(event) => patchCard(card.id, { subtitle: event.target.value })}
                          />
                        </label>
                        <label>
                          <span>Текст кнопки</span>
                          <input
                            value={card.buttonText}
                            onChange={(event) => patchCard(card.id, { buttonText: event.target.value })}
                          />
                        </label>
                        <label>
                          <span>Ссылка</span>
                          <input
                            value={card.buttonLink}
                            onChange={(event) => patchCard(card.id, { buttonLink: event.target.value })}
                            placeholder="/catalog"
                          />
                        </label>
                      </div>

                      <label className={styles.enabledRow}>
                        <input
                          type="checkbox"
                          checked={card.isEnabled}
                          onChange={(event) => patchCard(card.id, { isEnabled: event.target.checked })}
                        />
                        <span>Показывать эту карточку</span>
                      </label>

                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => removeCard(card.id)}
                      >
                        Удалить карточку
                      </button>
                    </article>
                  ))}
              </div>

              <button type="button" className={styles.addButton} onClick={addCard}>
                + Добавить карточку
              </button>
            </>
          ) : null}

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.saveButton}
              disabled={saving || uploadingId !== null || !hasChanges}
              onClick={() => void save()}
            >
              {saving ? "Сохранение…" : "Сохранить"}
            </button>
          </div>
        </>
      )}
    </AdminPanel>
  );
}
