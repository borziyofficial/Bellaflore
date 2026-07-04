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
            <path d="M12 4.5c-2.4 0-4.3 1.7-4.3 3.9 0 1.4.8 2.6 2.1 3.5-.5 1-.4 2 .4 2.8.8.8 1.9.9 2.8.9s2-.1 2.8-.9c.8-.8.9-1.8.4-2.8 1.3-.9 2.1-2.1 2.1-3.5 0-2.2-1.9-3.9-4.3-3.9Z" />
            <path d="M12 14.7V20" />
            <path d="M9.2 19.2c.9.7 1.8 1.1 2.8 1.1s1.9-.4 2.8-1.1" />
            <path d="M10.2 7.8c-.4-.7-.2-1.5.4-1.9" />
            <path d="M13.8 7.8c.4-.7.2-1.5-.4-1.9" />
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
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8.2 5.8c.6-.3 1.3-.1 1.6.5l1.1 2.3c.2.5.1 1-.3 1.4l-1 1a10.2 10.2 0 0 0 4.2 4.2l1-1c.4-.4.9-.5 1.4-.3l2.3 1.1c.6.3.8 1 .5 1.6l-1.1 2c-.4.7-1.1 1.1-1.9 1.1-5.8 0-10.5-4.7-10.5-10.5 0-.8.4-1.5 1.1-1.9Z" />
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
            <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
            <path d="M7.8 8.5h8.4l-1 10.2H8.8L7.8 8.5Z" />
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
