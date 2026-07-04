// ==================================================
// SECTION: MOBILE BOTTOM NAV
// РАЗДЕЛ: Мобильная нижняя навигация
//
// Purpose (EN):
// Fixed bottom tab bar for mobile quick navigation
//
// Назначение (RU):
// Нижняя мобильная навигация
// ==================================================
"use client";

import {
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
  useEffect,
  useState,
} from "react";
import navStyles from "@/components/navigation/MobileBottomNav.module.css";

type MobileBottomNavProps = {
  bottomNavCompact: boolean;
  bottomNavAction: string;
  contactHubOpen: boolean;
  favoritesPanelOpen: boolean;
  myOrderPanelOpen: boolean;
  favoriteBouquetIds: string[];
  handleHomeNavClick: (
    event: ReactMouseEvent<HTMLAnchorElement>,
  ) => void;
  handleHomeNavTouchEnd: (
    event: ReactTouchEvent<HTMLAnchorElement>,
  ) => void;
  handleSearchNavClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => void;
  handleSearchNavTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
  ) => void;
  handleContactNavClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => void;
  handleContactNavTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
  ) => void;
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
  contactHubOpen,
  favoritesPanelOpen,
  myOrderPanelOpen,
  favoriteBouquetIds,
  handleHomeNavClick,
  handleHomeNavTouchEnd,
  handleSearchNavClick,
  handleSearchNavTouchEnd,
  handleContactNavClick,
  handleContactNavTouchEnd,
  handleFavoritesNavClick,
  handleFavoritesNavTouchEnd,
  handleMyOrderNavClick,
  handleMyOrderNavTouchEnd,
}: MobileBottomNavProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <nav
      className={`${navStyles.nav} ${bottomNavCompact ? navStyles.compact : ""}`}
      aria-label="Быстрая мобильная навигация"
    >
      <span className={navStyles.glass} aria-hidden="true" />
      <span className="sr-only" aria-live="polite">
        {bottomNavAction}
      </span>
      <a
        className={navStyles.item}
        href="#home"
        aria-label="Главный"
        onClick={handleHomeNavClick}
        onTouchEnd={handleHomeNavTouchEnd}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M3.5 11.4 12 4l8.5 7.4" />
          <path d="M6.5 10.2V20h5v-5.2h3V20h5v-9.8" />
        </svg>
        <span className={navStyles.label}>Главный</span>
      </a>
      <button
        type="button"
        className={navStyles.item}
        onClick={handleSearchNavClick}
        onTouchEnd={handleSearchNavTouchEnd}
        aria-label="Каталог"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M5 7h14" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5 12h14" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5 17h14" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        <span className={navStyles.label}>Каталог</span>
      </button>
      <button
        type="button"
        className={`${navStyles.item} ${navStyles.itemPrimary} ${contactHubOpen ? navStyles.itemActive : ""}`}
        onClick={handleContactNavClick}
        onTouchEnd={handleContactNavTouchEnd}
        aria-label="Связь"
        aria-expanded={isMounted ? contactHubOpen : false}
        aria-pressed={isMounted ? contactHubOpen : false}
        aria-controls={
          isMounted && contactHubOpen ? "contact-quick-actions" : undefined
        }
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M21 4 10.6 14.4" />
          <path d="m21 4-6.6 18-3.8-7.6L3 10.6 21 4Z" />
        </svg>
        <span className={navStyles.label}>Связь</span>
      </button>
      <button
        type="button"
        className={`${navStyles.item} ${favoritesPanelOpen ? navStyles.itemActive : ""}`}
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
        <span className={navStyles.label}>Избранное</span>
      </button>
      <button
        type="button"
        className={`${navStyles.item} ${myOrderPanelOpen ? navStyles.itemActive : ""}`}
        onClick={handleMyOrderNavClick}
        onTouchEnd={handleMyOrderNavTouchEnd}
        aria-label="Мой профиль"
        aria-pressed={myOrderPanelOpen}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="12" cy="8.2" r="3.4" />
          <path d="M5.2 20v-1a6.8 6.8 0 0 1 13.6 0v1" />
        </svg>
        <span className={navStyles.label}>Профиль</span>
      </button>
    </nav>
  );
}
