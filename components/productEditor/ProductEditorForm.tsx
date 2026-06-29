import {
  PRODUCT_EDITOR_CATEGORIES,
  PRODUCT_EDITOR_OCCASION_OPTIONS,
} from "@/components/productEditor/productEditorMockData";
import type { ProductEditorDraft } from "@/components/productEditor/productEditorTypes";
import styles from "@/components/productEditor/ProductEditorForm.module.css";

type ProductEditorFormProps = {
  draft: ProductEditorDraft;
  onChange: (patch: Partial<ProductEditorDraft>) => void;
};

export function ProductEditorForm({ draft, onChange }: ProductEditorFormProps) {
  return (
    <div className={styles.fieldGrid}>
      <label className={`${styles.field} ${styles.fieldFull}`}>
        <span className={styles.label}>Название букета</span>
        <input
          className={styles.input}
          value={draft.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Slug / URL</span>
        <input
          className={styles.input}
          value={draft.slug}
          onChange={(event) => onChange({ slug: event.target.value })}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Категория</span>
        <select
          className={styles.select}
          value={draft.category}
          onChange={(event) => onChange({ category: event.target.value })}
        >
          {PRODUCT_EDITOR_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Цена</span>
        <input
          type="number"
          className={styles.input}
          value={draft.priceRub ?? ""}
          onChange={(event) =>
            onChange({
              priceRub: event.target.value ? Number(event.target.value) : null,
            })
          }
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Старая цена</span>
        <input
          type="number"
          className={styles.input}
          value={draft.oldPriceRub ?? ""}
          onChange={(event) =>
            onChange({
              oldPriceRub: event.target.value ? Number(event.target.value) : null,
            })
          }
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Количество цветов</span>
        <input
          type="number"
          className={styles.input}
          value={draft.flowerCount ?? ""}
          onChange={(event) =>
            onChange({
              flowerCount: event.target.value ? Number(event.target.value) : null,
            })
          }
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Размер</span>
        <select
          className={styles.select}
          value={draft.size}
          onChange={(event) =>
            onChange({ size: event.target.value as ProductEditorDraft["size"] })
          }
        >
          {(["S", "M", "L", "XL"] as const).map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Статус</span>
        <select
          className={styles.select}
          value={draft.status}
          onChange={(event) =>
            onChange({ status: event.target.value as ProductEditorDraft["status"] })
          }
        >
          <option value="draft">draft</option>
          <option value="active">active</option>
          <option value="hidden">hidden</option>
        </select>
      </label>

      <label className={`${styles.field} ${styles.fieldFull}`}>
        <span className={styles.label}>Короткое описание</span>
        <textarea
          className={styles.textarea}
          value={draft.shortDescription}
          onChange={(event) => onChange({ shortDescription: event.target.value })}
        />
      </label>

      <label className={`${styles.field} ${styles.fieldFull}`}>
        <span className={styles.label}>Полное описание</span>
        <textarea
          className={styles.textarea}
          value={draft.fullDescription}
          onChange={(event) => onChange({ fullDescription: event.target.value })}
        />
      </label>

      <label className={`${styles.field} ${styles.fieldFull}`}>
        <span className={styles.label}>Состав букета</span>
        <textarea
          className={styles.textarea}
          value={draft.composition}
          onChange={(event) => onChange({ composition: event.target.value })}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Цветовая гамма</span>
        <input
          className={styles.input}
          value={draft.colorPalette}
          onChange={(event) => onChange({ colorPalette: event.target.value })}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Повод</span>
        <select
          className={styles.select}
          value={draft.occasion}
          onChange={(event) =>
            onChange({ occasion: event.target.value as ProductEditorDraft["occasion"] })
          }
        >
          {PRODUCT_EDITOR_OCCASION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Сезонность</span>
        <input
          className={styles.input}
          value={draft.seasonality}
          onChange={(event) => onChange({ seasonality: event.target.value })}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Delivery note</span>
        <input
          className={styles.input}
          value={draft.deliveryNote}
          onChange={(event) => onChange({ deliveryNote: event.target.value })}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>SKU / артикул</span>
        <input
          className={styles.input}
          value={draft.sku}
          onChange={(event) => onChange({ sku: event.target.value })}
        />
      </label>
    </div>
  );
}
