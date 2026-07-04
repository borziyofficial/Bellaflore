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
import { ContactQuickActions } from "@/components/contact/ContactQuickActions";
import navStyles from "@/components/navigation/MobileBottomNav.module.css";

type MobileBottomNavProps = {
  bottomNavCompact: boolean;
  bottomNavAction: string;
  contactHubOpen: boolean;
  favoritesPanelOpen: boolean;
  myOrderPanelOpen: boolean;
  favoriteBouquetIds: string[];
  cartItemCount: number;
  publicAppView: "home" | "catalog";
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
  closeContactHub: () => void;
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
  cartItemCount,
  publicAppView,
  handleHomeNavClick,
  handleHomeNavTouchEnd,
  handleSearchNavClick,
  handleSearchNavTouchEnd,
  handleContactNavClick,
  handleContactNavTouchEnd,
  closeContactHub,
  handleFavoritesNavClick,
  handleFavoritesNavTouchEnd,
  handleMyOrderNavClick,
  handleMyOrderNavTouchEnd,
}: MobileBottomNavProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsMounted(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
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
        className={`${navStyles.item} ${publicAppView === "home" ? navStyles.itemActive : ""}`}
        href="#home"
        aria-label="Главная"
        onClick={handleHomeNavClick}
        onTouchEnd={handleHomeNavTouchEnd}
      >
        <span className={navStyles.iconWrap} aria-hidden="true">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 10.2 12 3.8l8 6.4" />
            <path d="M6.5 10.5V19h4v-4.8h3V19h4v-8.5" />
          </svg>
        </span>
        <span className={navStyles.label}>Главная</span>
      </a>
      <button
        type="button"
        className={`${navStyles.item} ${publicAppView === "catalog" ? navStyles.itemActive : ""}`}
        onClick={handleSearchNavClick}
        onTouchEnd={handleSearchNavTouchEnd}
        aria-label="Каталог"
      >
        <span className={navStyles.iconWrap} aria-hidden="true">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 4.2c-1.8 0-3.2 1.4-3.2 3.2 0 2 1.4 3.4 3.2 4.6 1.8-1.2 3.2-2.6 3.2-4.6 0-1.8-1.4-3.2-3.2-3.2Z" />
            <path d="M9.6 8.1c-.6-1-.1-2 .8-2.4M14.4 8.1c.6-1 .1-2-.8-2.4" />
            <path d="M12 11.8V18.2" />
            <path d="M10.2 18.2h3.6" />
          </svg>
        </span>
        <span className={navStyles.label}>Каталог</span>
      </button>
      <div className={navStyles.contactCluster}>
        {isMounted && contactHubOpen && (
          <ContactQuickActions closeContactHub={closeContactHub} />
        )}
        <button
          type="button"
          className={navStyles.itemContact}
          onClick={handleContactNavClick}
          onTouchEnd={handleContactNavTouchEnd}
          aria-label="Связь"
          aria-expanded={isMounted ? contactHubOpen : false}
          aria-pressed={isMounted ? contactHubOpen : false}
          aria-controls={
            isMounted && contactHubOpen ? "contact-quick-actions" : undefined
          }
        >
          <span className={navStyles.contactFab} aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
          </span>
          <span className={navStyles.labelContact}>Связь</span>
        </button>
      </div>
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
        <span className={navStyles.iconWrap} aria-hidden="true">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20.1s-6.8-4-8.5-8.4C2.2 8.2 3.9 5.8 6.8 5.8c1.6 0 3 0.9 3.9 2.1.9-1.2 2.3-2.1 3.9-2.1 2.9 0 4.6 2.4 3.3 5.9-1.7 4.4-8.5 8.4-8.5 8.4Z" />
          </svg>
        </span>
        <span className={navStyles.label}>Избранное</span>
      </button>
      <button
        type="button"
        className={`${navStyles.item} ${myOrderPanelOpen ? navStyles.itemActive : ""}`}
        onClick={handleMyOrderNavClick}
        onTouchEnd={handleMyOrderNavTouchEnd}
        aria-label={
          cartItemCount > 0
            ? `Мой заказ, ${cartItemCount} товаров`
            : "Мой заказ"
        }
        aria-pressed={myOrderPanelOpen}
      >
        <span className={navStyles.iconWrap} aria-hidden="true">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8.2 9.2h7.6l-1 10.3H9.2L8.2 9.2Z" />
            <path d="M9.8 9.2V7.4a2.2 2.2 0 0 1 4.4 0v1.8" />
            <path d="M10.2 13.2h3.6" />
          </svg>
          {cartItemCount > 0 && (
            <span className={navStyles.orderBadge} aria-hidden="true">
              {cartItemCount}
            </span>
          )}
        </span>
        <span className={navStyles.label}>Мой заказ</span>
      </button>
    </nav>
  );
}
