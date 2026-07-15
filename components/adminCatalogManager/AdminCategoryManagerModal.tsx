// ==================================================
// SECTION: Admin Catalog Manager — category management modal
// РАЗДЕЛ: Управление категориями (создание, переименование, удаление)
// ==================================================
"use client";

import { useState } from "react";
import { AdminCategoryApiError } from "@/components/adminCatalogManager/adminCustomCategories";
import type { AdminCategoryRecord } from "@/components/adminCatalogManager/useAdminCategories";
import styles from "@/components/adminCatalogManager/AdminProductStudio.module.css";

type AdminCategoryManagerModalProps = {
  open: boolean;
  categories: AdminCategoryRecord[];
  onClose: () => void;
  onCreate: (title: string) => Promise<AdminCategoryRecord>;
  onRename: (id: string, title: string) => Promise<AdminCategoryRecord>;
  onDelete: (id: string, reassignTo?: string) => Promise<{ reassignedCount: number }>;
};

export function AdminCategoryManagerModal({
  open,
  categories,
  onClose,
  onCreate,
  onRename,
  onDelete,
}: AdminCategoryManagerModalProps) {
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteInUseCount, setDeleteInUseCount] = useState<number | null>(null);
  const [reassignTo, setReassignTo] = useState("");

  if (!open) {
    return null;
  }

  const customCategories = categories.filter((category) => category.isCustom);
  const builtinCategories = categories.filter((category) => !category.isCustom);

  const resetDeleteState = () => {
    setDeleteTargetId(null);
    setDeleteInUseCount(null);
    setReassignTo("");
  };

  const handleCreate = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed || creating) {
      return;
    }
    setCreating(true);
    setNotice(null);
    try {
      await onCreate(trimmed);
      setNewTitle("");
      setNotice({ tone: "success", text: "Категория создана." });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Не удалось создать категорию.",
      });
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (category: AdminCategoryRecord) => {
    setEditingId(category.id);
    setEditingTitle(category.title);
    setNotice(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const saveEdit = async (id: string) => {
    const trimmed = editingTitle.trim();
    if (!trimmed) {
      return;
    }
    setSavingId(id);
    setNotice(null);
    try {
      await onRename(id, trimmed);
      cancelEdit();
      setNotice({ tone: "success", text: "Название обновлено." });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Не удалось изменить категорию.",
      });
    } finally {
      setSavingId(null);
    }
  };

  const requestDelete = (id: string) => {
    setDeleteTargetId(id);
    setDeleteInUseCount(null);
    setReassignTo("");
    setNotice(null);
  };

  const confirmDelete = async (reassign?: string) => {
    if (!deleteTargetId) {
      return;
    }
    setSavingId(deleteTargetId);
    try {
      await onDelete(deleteTargetId, reassign);
      setNotice({ tone: "success", text: "Категория удалена." });
      resetDeleteState();
    } catch (error) {
      if (error instanceof AdminCategoryApiError && error.code === "CATEGORY_IN_USE") {
        setDeleteInUseCount(error.count ?? 0);
      } else {
        setNotice({
          tone: "error",
          text: error instanceof Error ? error.message : "Не удалось удалить категорию.",
        });
        resetDeleteState();
      }
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className={styles.dialogBackdrop}>
      <div className={styles.dialog} role="dialog" aria-modal="true">
        <h3>Категории</h3>
        {notice ? <p className={styles[notice.tone]}>{notice.text}</p> : null}

        <div className={styles.field}>
          <span>Новая категория</span>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="Например, Свадебные"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleCreate();
                }
              }}
            />
            <button
              type="button"
              className={styles.primaryButton}
              disabled={creating || !newTitle.trim()}
              onClick={() => void handleCreate()}
            >
              {creating ? "Создание…" : "Добавить"}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Пользовательские категории</p>
          {customCategories.length === 0 ? (
            <p className={styles.info}>Пока нет ни одной пользовательской категории.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {customCategories.map((category) => (
                <li key={category.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {editingId === category.id ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        value={editingTitle}
                        onChange={(event) => setEditingTitle(event.target.value)}
                        autoFocus
                      />
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => void saveEdit(category.id)}
                        disabled={savingId === category.id || !editingTitle.trim()}
                      >
                        Сохранить
                      </button>
                      <button type="button" className={styles.secondaryButton} onClick={cancelEdit}>
                        Отмена
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <span>{category.title}</span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" className={styles.secondaryButton} onClick={() => startEdit(category)}>
                          Изменить
                        </button>
                        <button
                          type="button"
                          className={styles.dangerButton}
                          onClick={() => requestDelete(category.id)}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  )}

                  {deleteTargetId === category.id ? (
                    <div className={styles.field} style={{ background: "rgba(0,0,0,0.03)", padding: 10, borderRadius: 8 }}>
                      {deleteInUseCount === null ? (
                        <>
                          <p>Удалить категорию «{category.title}»?</p>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              type="button"
                              className={styles.dangerButton}
                              onClick={() => void confirmDelete()}
                              disabled={savingId === category.id}
                            >
                              Удалить
                            </button>
                            <button type="button" className={styles.secondaryButton} onClick={resetDeleteState}>
                              Отмена
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className={styles.error}>
                            В категории {deleteInUseCount} товар(ов). Удаление запрещено без
                            переноса — выберите категорию для переноса товаров.
                          </p>
                          <div style={{ display: "flex", gap: 8 }}>
                            <select value={reassignTo} onChange={(event) => setReassignTo(event.target.value)}>
                              <option value="">Куда перенести товары</option>
                              {[...builtinCategories, ...customCategories]
                                .filter((option) => option.id !== category.id)
                                .map((option) => (
                                  <option key={option.id} value={option.id}>
                                    {option.title}
                                  </option>
                                ))}
                            </select>
                            <button
                              type="button"
                              className={styles.dangerButton}
                              disabled={!reassignTo || savingId === category.id}
                              onClick={() => void confirmDelete(reassignTo)}
                            >
                              Перенести и удалить
                            </button>
                            <button type="button" className={styles.secondaryButton} onClick={resetDeleteState}>
                              Отмена
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Встроенные категории</p>
          <p className={styles.info}>
            {builtinCategories.map((category) => category.title).join(", ")} — часть базовой
            структуры каталога, их нельзя переименовать или удалить.
          </p>
        </div>

        <div className={styles.dialogActions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
