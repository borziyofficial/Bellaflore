// ==================================================
// SECTION: ADDRESS SEARCH
// РАЗДЕЛ: Поиск адреса
//
// Purpose (EN):
// Smart address input with geocoder suggestions
//
// Назначение (RU):
// Умный ввод адреса с подсказками геокодера
// ==================================================
"use client";

import { getAddressIntelligenceHelperMessage } from "@/components/addressIntelligence/addressIntelligenceMessages";
import {
  getYandexAddressPriorityTierLabel,
  resolveYandexAddressPriorityTier,
} from "@/components/addressIntelligence/yandexAddressPriority";
import type { AddressSuggestion } from "@/components/addressIntelligence/addressIntelligenceTypes";
import { useLiveGeocoderSuggestions } from "@/components/addressIntelligence/useLiveGeocoderSuggestions";
import styles from "@/components/checkout/AddressIntelligenceInput.module.css";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";

type AddressIntelligenceInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSuggestionSelect?: (suggestion: AddressSuggestion) => void;
  onAddressEdit?: () => void;
  onBlur?: () => void;
  onFocus?: () => void;
  invalid?: boolean;
  showInvalid?: boolean;
  required?: boolean;
};

export function AddressIntelligenceInput({
  value,
  onChange,
  onSuggestionSelect,
  onAddressEdit,
  onBlur,
  onFocus,
  invalid = false,
  showInvalid = false,
  required = false,
}: AddressIntelligenceInputProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const geocoder = useLiveGeocoderSuggestions(value);

  const localHelperMessage = getAddressIntelligenceHelperMessage(
    geocoder.intelligenceStatus,
  );
  const helperMessage =
    geocoder.uxMessage ??
    (geocoder.suggestions.length === 0 ? localHelperMessage : null);
  const showSuggestions = menuOpen && geocoder.suggestions.length > 0;
  const showEmptyState =
    menuOpen &&
    geocoder.isQueryReady &&
    !geocoder.isLoading &&
    geocoder.suggestions.length === 0 &&
    geocoder.status === "no_results";

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, {
      passive: true,
    });
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onAddressEdit?.();
    onChange(event.target.value);
    setMenuOpen(true);
    setActiveSuggestionIndex(-1);
  };

  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    onChange(suggestion.label.trim());
    onSuggestionSelect?.(suggestion);
    setMenuOpen(false);
    setActiveSuggestionIndex(-1);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestionIndex((current) =>
        current >= geocoder.suggestions.length - 1 ? 0 : current + 1,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestionIndex((current) =>
        current <= 0 ? geocoder.suggestions.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Enter" && activeSuggestionIndex >= 0) {
      event.preventDefault();
      const suggestion = geocoder.suggestions[activeSuggestionIndex];
      if (suggestion) {
        handleSuggestionSelect(suggestion);
      }
      return;
    }

    if (event.key === "Escape") {
      setMenuOpen(false);
    }
  };

  useEffect(() => {
    if (!showSuggestions || typeof window === "undefined") {
      return;
    }

    const viewport = window.visualViewport;
    const updateSuggestionMaxHeight = () => {
      const root = containerRef.current;
      if (!root) {
        return;
      }

      const inputRect = root.getBoundingClientRect();
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const spaceBelow = Math.max(96, viewportHeight - inputRect.bottom - 12);
      root.style.setProperty(
        "--suggest-max-h",
        `${Math.min(220, spaceBelow)}px`,
      );
    };

    updateSuggestionMaxHeight();
    viewport?.addEventListener("resize", updateSuggestionMaxHeight);
    viewport?.addEventListener("scroll", updateSuggestionMaxHeight);
    window.addEventListener("resize", updateSuggestionMaxHeight);

    const root = containerRef.current;

    return () => {
      viewport?.removeEventListener("resize", updateSuggestionMaxHeight);
      viewport?.removeEventListener("scroll", updateSuggestionMaxHeight);
      window.removeEventListener("resize", updateSuggestionMaxHeight);
      root?.style.removeProperty("--suggest-max-h");
    };
  }, [showSuggestions]);

  const showInputInvalid = showInvalid && invalid;
  const showGeocoderErrors = showInvalid && geocoder.localErrors.length > 0;
  const statusClassName = geocoder.intelligenceStatus.replace(/_/g, "-");

  const scrollIntoSafeView = () => {
    if (typeof window === "undefined") {
      return;
    }

    requestAnimationFrame(() => {
      containerRef.current?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
      document
        .getElementById("checkout-accordion-panel-address")
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  };

  const handleInputFocus = () => {
    setMenuOpen(true);
    scrollIntoSafeView();
    onFocus?.();
  };

  useEffect(() => {
    if (typeof window === "undefined" || !menuOpen) {
      return;
    }

    const viewport = window.visualViewport;
    const keepVisible = () => scrollIntoSafeView();

    viewport?.addEventListener("resize", keepVisible);
    return () => viewport?.removeEventListener("resize", keepVisible);
  }, [menuOpen]);

  return (
    <div
      ref={containerRef}
      className={`${styles.root} ${styles[statusClassName] ?? ""} ${
        geocoder.isLoading ? styles.loading : ""
      }`}
      role="combobox"
      aria-expanded={showSuggestions}
      aria-haspopup="listbox"
      aria-controls="checkout-address-suggestions"
      aria-busy={geocoder.isLoading}
    >
      {/* ==================================================
SECTION: ADDRESS SEARCH
РАЗДЕЛ: Поле ввода адреса доставки
Purpose (EN): Text input for delivery address
Назначение (RU): Поле ввода адреса доставки
================================================== */}
      <input
        type="text"
        className={styles.input}
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={onBlur}
        onKeyDown={handleInputKeyDown}
        placeholder="Начните вводить адрес..."
        autoComplete="street-address"
        aria-label="Адрес доставки"
        aria-invalid={showInputInvalid}
        aria-autocomplete="list"
        required={required}
      />

      {helperMessage ? (
        <p className={styles.helper} role="status">
          {helperMessage}
        </p>
      ) : null}

      {geocoder.isLoading ? (
        <p className={styles.loadingHint} role="status">
          Ищем адрес...
        </p>
      ) : null}

      {showEmptyState ? (
        <p className={styles.emptyState} role="status">
          Уточните адрес или выберите подсказку
        </p>
      ) : null}

      {geocoder.localWarnings.length > 0 && showInvalid ? (
        <ul className={styles.warnings}>
          {geocoder.localWarnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      {showGeocoderErrors ? (
        <ul className={styles.errors}>
          {geocoder.localErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      {showSuggestions ? (
        <ul
          id="checkout-address-suggestions"
          className={styles.suggestions}
          role="listbox"
          aria-label="Подсказки адреса"
        >
          {/* ==================================================
SECTION: ADDRESS SEARCH
РАЗДЕЛ: Выпадающий список подсказок геокодера
Purpose (EN): Geocoder suggestion dropdown
Назначение (RU): Выпадающий список подсказок геокодера
================================================== */}
          {geocoder.suggestions.map((suggestion, index) => {
            const priorityTier = resolveYandexAddressPriorityTier(
              `${suggestion.label} ${suggestion.fullAddress}`,
            );
            const priorityLabel = getYandexAddressPriorityTierLabel(priorityTier);
            const districtLine = suggestion.districtLine?.trim() ?? "";
            const cityLine = suggestion.city?.trim() ?? "";

            return (
            <li key={suggestion.id} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={index === activeSuggestionIndex}
                className={`${styles.suggestion} ${
                  index === activeSuggestionIndex ? styles.suggestionActive : ""
                } ${priorityLabel ? styles.suggestionPriority : ""}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <span className={styles.suggestionLabel}>{suggestion.label}</span>
                {districtLine ? (
                  <span className={styles.suggestionRegion}>{districtLine}</span>
                ) : null}
                {cityLine ? (
                  <span className={styles.suggestionCity}>{cityLine}</span>
                ) : null}
              </button>
            </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
