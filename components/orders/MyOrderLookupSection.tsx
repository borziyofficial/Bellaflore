// ==================================================
// SECTION: MY PROFILE
// РАЗДЕЛ: Поиск заказа по номеру телефона или номеру заказа
//
// Purpose (EN):
// Lets the customer look up a real, server-stored order by phone
// number or order number, independently of local browser storage.
//
// Назначение (RU):
// Позволяет покупателю найти реальный заказ на сервере по номеру
// телефона или номеру заказа — независимо от localStorage.
// ==================================================
"use client";

import { useEffect, useState } from "react";
import {
  MyOrderPassport,
  MyOrderPassportEmpty,
  type OrderPassportData,
} from "@/components/orders/MyOrderPassport";
import {
  OrderLookupError,
  lookupOrderByNumber,
  lookupOrdersByPhone,
  mapLookupOrderToPassport,
} from "@/components/orders/orderLookupClient";
import styles from "@/components/orders/MyOrderLookupSection.module.css";

type SearchMode = "orderNumber" | "phone";

type MyOrderLookupSectionProps = {
  initialOrderNumber: string | null;
  onOpenCatalog: () => void;
  formatPrice: (priceRub: number) => string;
};

export function MyOrderLookupSection({
  initialOrderNumber,
  onOpenCatalog,
  formatPrice,
}: MyOrderLookupSectionProps) {
  const [searchMode, setSearchMode] = useState<SearchMode>("orderNumber");
  const [queryValue, setQueryValue] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "found" | "notFound" | "error">(
    initialOrderNumber ? "loading" : "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [results, setResults] = useState<OrderPassportData[]>([]);
  const [hasSearchedManually, setHasSearchedManually] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!initialOrderNumber) {
      return;
    }

    lookupOrderByNumber(initialOrderNumber)
      .then((order) => {
        if (cancelled) return;
        setResults([mapLookupOrderToPassport(order)]);
        setStatus("found");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof OrderLookupError && error.code === "NOT_FOUND") {
          setStatus("notFound");
          setErrorMessage(
            "Заказ не найден на сервере. Возможно, он был создан на другом устройстве или ещё не синхронизирован.",
          );
          return;
        }
        setStatus("error");
        setErrorMessage(
          error instanceof OrderLookupError
            ? error.message
            : "Не удалось получить данные заказа. Попробуйте ещё раз.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [initialOrderNumber]);

  const runSearch = async () => {
    const trimmed = queryValue.trim();
    if (!trimmed) {
      setStatus("error");
      setErrorMessage(
        searchMode === "phone"
          ? "Введите номер телефона."
          : "Введите номер заказа.",
      );
      return;
    }

    setHasSearchedManually(true);
    setStatus("loading");
    setErrorMessage(null);

    try {
      if (searchMode === "orderNumber") {
        const order = await lookupOrderByNumber(trimmed);
        setResults([mapLookupOrderToPassport(order)]);
      } else {
        const orders = await lookupOrdersByPhone(trimmed);
        setResults(orders.map(mapLookupOrderToPassport));
      }
      setStatus("found");
    } catch (error) {
      setResults([]);
      setStatus(
        error instanceof OrderLookupError && error.code === "NOT_FOUND"
          ? "notFound"
          : "error",
      );
      setErrorMessage(
        error instanceof OrderLookupError
          ? error.message
          : "Не удалось найти заказ. Попробуйте ещё раз.",
      );
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runSearch();
  };

  const showSearchForm = hasSearchedManually || status === "idle" || status === "notFound" || status === "error" || (!initialOrderNumber && status !== "loading");

  return (
    <div className={styles.wrap}>
      {showSearchForm ? (
        <form className={styles.searchForm} onSubmit={handleSubmit}>
          <div className={styles.modeToggle} role="tablist" aria-label="Способ поиска заказа">
            <button
              type="button"
              role="tab"
              aria-selected={searchMode === "orderNumber"}
              className={`${styles.modeButton} ${
                searchMode === "orderNumber" ? styles.modeButtonActive : ""
              }`}
              onClick={() => setSearchMode("orderNumber")}
            >
              По номеру заказа
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={searchMode === "phone"}
              className={`${styles.modeButton} ${
                searchMode === "phone" ? styles.modeButtonActive : ""
              }`}
              onClick={() => setSearchMode("phone")}
            >
              По телефону
            </button>
          </div>
          <div className={styles.inputRow}>
            <input
              type={searchMode === "phone" ? "tel" : "text"}
              className={styles.input}
              placeholder={
                searchMode === "phone" ? "+7 999 000-00-00" : "BF-20260803-XXXXXXXXXX"
              }
              value={queryValue}
              onChange={(event) => setQueryValue(event.target.value)}
              aria-label={
                searchMode === "phone" ? "Номер телефона" : "Номер заказа"
              }
            />
            <button
              type="submit"
              className={styles.searchButton}
              disabled={status === "loading"}
            >
              {status === "loading" ? "Ищем…" : "Найти"}
            </button>
          </div>
        </form>
      ) : null}

      {status === "loading" ? (
        <p className={styles.statusMessage} role="status">
          Загружаем данные заказа…
        </p>
      ) : null}

      {status === "notFound" || status === "error" ? (
        <p className={styles.statusMessage} role="status">
          {errorMessage ?? "Заказ не найден."}
        </p>
      ) : null}

      {status === "found" && results.length > 0 ? (
        <div className={styles.results}>
          {results.map((passport) => (
            <MyOrderPassport
              key={passport.orderNumber ?? passport.recipientName}
              data={passport}
              formatPrice={formatPrice}
            />
          ))}
        </div>
      ) : null}

      {status === "idle" && !initialOrderNumber ? (
        <MyOrderPassportEmpty onOpenCatalog={onOpenCatalog} />
      ) : null}
    </div>
  );
}
