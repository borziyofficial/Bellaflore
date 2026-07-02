// ==================================================
// SECTION: SMART SEARCH
// РАЗДЕЛ: Smart Search Hints UI
//
// Purpose (EN): Suggestion chips for catalog search without breaking existing UI.
//
// Назначение (RU): Подсказки поиска в каталоге.
// ==================================================
"use client";

import { getSmartSearchSuggestions } from "@/components/smartSearch/smartSearchSuggestions";
import styles from "@/components/smartSearch/SmartSearchHints.module.css";

type SmartSearchHintsProps = {
  onSuggestionSelect: (query: string) => void;
  visible?: boolean;
};

export function SmartSearchHints({
  onSuggestionSelect,
  visible = true,
}: SmartSearchHintsProps) {
  if (!visible) {
    return null;
  }

  const suggestions = getSmartSearchSuggestions();

  return (
    <div className={styles.hints} aria-label="Подсказки поиска">
      <p className={styles.label}>Популярные запросы</p>
      <div className={styles.list} role="list">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            type="button"
            className={styles.chip}
            role="listitem"
            onClick={() => onSuggestionSelect(suggestion.query)}
          >
            {suggestion.label}
          </button>
        ))}
      </div>
    </div>
  );
}
