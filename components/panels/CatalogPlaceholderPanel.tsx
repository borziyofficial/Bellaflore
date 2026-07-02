// ==================================================
// SECTION: CATALOG
// РАЗДЕЛ: Каталог
//
// Purpose (EN):
// Placeholder panel while premium catalog is in development
//
// Назначение (RU):
// Заглушка каталога на время разработки
// ==================================================
"use client";

type CatalogPlaceholderPanelProps = {
  onClose: () => void;
  onReturnToBouquets: () => void;
};

export function CatalogPlaceholderPanel({
  onClose,
  onReturnToBouquets,
}: CatalogPlaceholderPanelProps) {
  return (
    <div
      className="search-panel-overlay catalog-placeholder-overlay"
      role="presentation"
      onClick={onClose}
    >
      {/* ==================================================
SECTION: CATALOG
РАЗДЕЛ: Диалог-заглушка каталога
Purpose (EN): Placeholder dialog while catalog loads
Назначение (RU): Диалог-заглушка каталога
================================================== */}
      <aside
        className="catalog-placeholder-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-placeholder-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="catalog-placeholder-header">
          <h2 id="catalog-placeholder-title">Каталог Bellaflore</h2>
          <button
            type="button"
            className="search-panel-close"
            onClick={onClose}
            aria-label="Закрыть каталог"
          >
            ×
          </button>
        </div>
        <p className="catalog-placeholder-copy">
          Новый премиальный каталог скоро будет доступен.
        </p>
        <button
          type="button"
          className="buy-button catalog-placeholder-button"
          onClick={onReturnToBouquets}
        >
          Вернуться к букетам
        </button>
      </aside>
    </div>
  );
}
