"use client";

import { useMemo, useState } from "react";
import { ProductImageWithFallback } from "@/components/product/ProductImageWithFallback";
import type { CatalogProduct } from "@/data/catalogProducts";
import styles from "@/components/home/AiFlorist.module.css";

type AiFloristProps = {
  bouquets: CatalogProduct[];
  formatPrice: (priceRub: number) => string;
  onProductOpen?: (productId: string) => void;
};

type OccasionId = "romantic" | "mother" | "birthday" | "business";
type BudgetId = "under-5000" | "5000-10000" | "10000-20000" | "20000-plus";

const occasions: Array<{ id: OccasionId; label: string; terms: string[] }> = [
  { id: "romantic", label: "Для неё", terms: ["девушка", "любимая", "жене", "romantic", "нежный"] },
  { id: "mother", label: "Маме", terms: ["мама", "маме", "mother", "нежный"] },
  { id: "birthday", label: "День рождения", terms: ["день рождения", "birthday", "подарок"] },
  { id: "business", label: "Деловой подарок", terms: ["премиум", "luxury", "авторский", "композиция"] },
];

const budgets: Array<{
  id: BudgetId;
  label: string;
  min: number;
  max: number;
}> = [
  { id: "under-5000", label: "До 5 000 ₽", min: 0, max: 5000 },
  { id: "5000-10000", label: "5–10 тыс. ₽", min: 5000, max: 10000 },
  { id: "10000-20000", label: "10–20 тыс. ₽", min: 10000, max: 20000 },
  { id: "20000-plus", label: "От 20 000 ₽", min: 20000, max: Number.POSITIVE_INFINITY },
];

function searchableText(product: CatalogProduct): string {
  return [
    product.title,
    product.description,
    product.category,
    product.flowerType,
    ...(product.tags ?? []),
    ...(product.searchTerms ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function AiFlorist({ bouquets, formatPrice, onProductOpen }: AiFloristProps) {
  const [open, setOpen] = useState(false);
  const [occasionId, setOccasionId] = useState<OccasionId | null>(null);
  const [budgetId, setBudgetId] = useState<BudgetId | null>(null);

  const recommendations = useMemo(() => {
    if (!occasionId || !budgetId) {
      return [];
    }

    const occasion = occasions.find((item) => item.id === occasionId);
    const budget = budgets.find((item) => item.id === budgetId);
    if (!occasion || !budget) {
      return [];
    }

    const inBudget = bouquets.filter(
      (product) => product.priceRub >= budget.min && product.priceRub < budget.max,
    );
    const pool = inBudget.length > 0 ? inBudget : bouquets;
    const matched = pool.filter((product) => {
      const haystack = searchableText(product);
      return occasion.terms.some((term) => haystack.includes(term));
    });
    const source = matched.length >= 3 ? matched : pool;
    return source.slice(0, 3);
  }, [bouquets, budgetId, occasionId]);

  const reset = () => {
    setOccasionId(null);
    setBudgetId(null);
  };

  return (
    <div className={styles.root}>
      {open ? (
        <section className={styles.panel} aria-label="AI-флорист BellaFlore">
          <div className={styles.panelHeader}>
            <div className={styles.identity}>
              <span className={styles.smallMark} aria-hidden="true">✦</span>
              <div>
                <strong>AI-флорист BellaFlore</strong>
                <span>Подберу из реального каталога</span>
              </div>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setOpen(false)}
              aria-label="Закрыть AI-флориста"
            >
              ×
            </button>
          </div>

          <div className={styles.chatBody}>
            <div className={styles.assistantBubble}>
              {!occasionId
                ? "Добрый вечер. Для кого выбираем цветы?"
                : !budgetId
                  ? "Понял. Какой бюджет комфортен?"
                  : "Нашёл варианты, которые подходят лучше всего. Можно открыть любой букет."}
            </div>

            {!occasionId ? (
              <div className={styles.quickReplies}>
                {occasions.map((occasion) => (
                  <button
                    key={occasion.id}
                    type="button"
                    onClick={() => setOccasionId(occasion.id)}
                  >
                    {occasion.label}
                  </button>
                ))}
              </div>
            ) : null}

            {occasionId && !budgetId ? (
              <>
                <div className={styles.userBubble}>
                  {occasions.find((item) => item.id === occasionId)?.label}
                </div>
                <div className={styles.quickReplies}>
                  {budgets.map((budget) => (
                    <button
                      key={budget.id}
                      type="button"
                      onClick={() => setBudgetId(budget.id)}
                    >
                      {budget.label}
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {occasionId && budgetId ? (
              <>
                <div className={styles.userBubble}>
                  {occasions.find((item) => item.id === occasionId)?.label} ·{" "}
                  {budgets.find((item) => item.id === budgetId)?.label}
                </div>
                <div className={styles.recommendations}>
                  {recommendations.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      className={styles.productCard}
                      onClick={() => {
                        onProductOpen?.(product.id);
                        setOpen(false);
                      }}
                    >
                      <span className={styles.productImage}>
                        <ProductImageWithFallback
                          src={product.src}
                          alt={product.alt}
                          width={product.width}
                          height={product.height}
                          sizes="82px"
                          imageClassName={styles.productImg}
                          fallbackClassName={styles.productFallback}
                        />
                      </span>
                      <span className={styles.productCopy}>
                        <strong>{product.title}</strong>
                        <span>{formatPrice(product.priceRub)}</span>
                      </span>
                      <span className={styles.productArrow} aria-hidden="true">→</span>
                    </button>
                  ))}
                </div>
                <button type="button" className={styles.restartButton} onClick={reset}>
                  Подобрать заново
                </button>
              </>
            ) : null}
          </div>

          <p className={styles.disclaimer}>
            Сейчас это умный подбор по каталогу BellaFlore. Свободный AI-диалог подключим следующим этапом.
          </p>
        </section>
      ) : null}

      <button
        type="button"
        className={styles.launcher}
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Закрыть AI-флориста" : "Открыть AI-флориста BellaFlore"}
        aria-expanded={open}
      >
        <span aria-hidden="true">✦</span>
      </button>
    </div>
  );
}
