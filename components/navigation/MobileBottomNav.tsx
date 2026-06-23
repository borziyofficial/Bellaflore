"use client";

import {
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";

type MobileBottomNavProps = {
  bottomNavCompact: boolean;
  bottomNavAction: string;
  searchPanelOpen: boolean;
  contactHubOpen: boolean;
  favoritesPanelOpen: boolean;
  myOrderPanelOpen: boolean;
  favoriteBouquetIds: string[];
  handleSearchNavClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => void;
  handleSearchNavTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
  ) => void;
  toggleContactHub: () => void;
  handleFavoritesNavClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => void;
  handleFavoritesNavTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
  ) => void;
  handleMyOrderNavClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => void;
  handleMyOrderNavTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
  ) => void;
};

export function MobileBottomNav({
  bottomNavCompact,
  bottomNavAction,
  searchPanelOpen,
  contactHubOpen,
  favoritesPanelOpen,
  myOrderPanelOpen,
  favoriteBouquetIds,
  handleSearchNavClick,
  handleSearchNavTouchEnd,
  toggleContactHub,
  handleFavoritesNavClick,
  handleFavoritesNavTouchEnd,
  handleMyOrderNavClick,
  handleMyOrderNavTouchEnd,
}: MobileBottomNavProps) {
  return (
    <nav
      className={`mobile-bottom-nav ${bottomNavCompact ? "mobile-bottom-nav-compact" : ""}`}
      aria-label="Быстрая мобильная навигация"
    >
      <span className="mobile-bottom-nav-glass" aria-hidden="true" />
      <span className="sr-only" aria-live="polite">
        {bottomNavAction}
      </span>
      <a
        className="mobile-bottom-nav-item"
        href="#home"
        aria-label="Главный"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M3.5 11.4 12 4l8.5 7.4" />
          <path d="M6.5 10.2V20h5v-5.2h3V20h5v-9.8" />
        </svg>
        <span className="mobile-bottom-nav-label">Главный</span>
      </a>
      <button
        type="button"
        className={`mobile-bottom-nav-item ${searchPanelOpen ? "mobile-bottom-nav-item-active" : ""}`}
        onClick={handleSearchNavClick}
        onTouchEnd={handleSearchNavTouchEnd}
        aria-label="Каталог"
        aria-pressed={searchPanelOpen}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="10.8" cy="10.8" r="6.3" />
          <path d="m16.1 16.1 4.4 4.4" />
        </svg>
        <span className="mobile-bottom-nav-label">Каталог</span>
      </button>
      <button
        type="button"
        className="mobile-bottom-nav-item mobile-bottom-nav-primary"
        onClick={toggleContactHub}
        aria-label="Связь"
        aria-expanded={contactHubOpen}
        aria-controls="contact-quick-actions"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M21 4 10.6 14.4" />
          <path d="m21 4-6.6 18-3.8-7.6L3 10.6 21 4Z" />
        </svg>
        <span className="mobile-bottom-nav-label">Связь</span>
      </button>
      <button
        type="button"
        className={`mobile-bottom-nav-item ${favoritesPanelOpen ? "mobile-bottom-nav-item-active" : ""}`}
        onClick={handleFavoritesNavClick}
        onTouchEnd={handleFavoritesNavTouchEnd}
        aria-label={
          favoriteBouquetIds.length > 0
            ? `Показать избранное, ${favoriteBouquetIds.length}`
            : "Избранное"
        }
        aria-pressed={favoritesPanelOpen}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M12 20.5s-7.3-4.4-9-9.2C1.9 8 3.9 5.2 7 5.2c1.8 0 3.1 1 4 2.2.9-1.2 2.2-2.2 4-2.2 3.1 0 5.1 2.8 4 6.1-1.7 4.8-9 9.2-9 9.2Z" />
        </svg>
        {favoriteBouquetIds.length > 0 && (
          <span className="favorite-count-badge" aria-hidden="true">
            {favoriteBouquetIds.length}
          </span>
        )}
        <span className="mobile-bottom-nav-label">Избранное</span>
      </button>
      <button
        type="button"
        className={`mobile-bottom-nav-item ${myOrderPanelOpen ? "mobile-bottom-nav-item-active" : ""}`}
        onClick={handleMyOrderNavClick}
        onTouchEnd={handleMyOrderNavTouchEnd}
        aria-label="Мой заказ"
        aria-pressed={myOrderPanelOpen}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M7.2 3.8h8.2l2.4 2.4v14H7.2z" />
          <path d="M15.4 3.8v2.4h2.4" />
          <path d="M9.6 10.1h4.8" />
          <path d="M9.6 13.2h3.2" />
          <path d="m10 17 1.5 1.5 3-3.2" />
        </svg>
        <span className="mobile-bottom-nav-label">Мой заказ</span>
      </button>
    </nav>
  );
}
