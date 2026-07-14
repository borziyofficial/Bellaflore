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
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M3 10.5L12 3L21 10.5"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5.5 9V19.5C5.5 20.0523 5.94772 20.5 6.5 20.5H9.5V15C9.5 14.4477 9.94772 14 10.5 14H13.5C14.0523 14 14.5 14.4477 14.5 15V20.5H17.5C18.0523 20.5 18.5 20.0523 18.5 19.5V9"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
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
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M4.5 7H19.5"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4.5 12H19.5"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4.5 17H19.5"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
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
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7293C21.7209 20.9845 21.5573 21.2136 21.3521 21.4019C21.1469 21.5901 20.9046 21.7335 20.6407 21.8227C20.3769 21.9119 20.0974 21.9451 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77383 17.3147 6.72534 15.2662 5.18999 12.85C3.49997 10.2412 2.44824 7.27099 2.11999 4.17999C2.09501 3.90347 2.12787 3.62476 2.21649 3.36163C2.30512 3.09849 2.44756 2.85669 2.63476 2.65162C2.82196 2.44655 3.0498 2.28271 3.30379 2.17052C3.55777 2.05833 3.83233 2.00026 4.10999 1.99999H7.10999C7.5953 1.99522 8.06579 2.16708 8.43376 2.48353C8.80173 2.79999 9.04207 3.23945 9.10999 3.71999C9.23662 4.68004 9.47144 5.62282 9.80999 6.52999C9.94454 6.88848 9.97366 7.27811 9.8939 7.65038C9.81415 8.02261 9.62887 8.36347 9.35999 8.62999L8.08999 9.89999C9.51355 12.4136 11.5865 14.4865 14.1 15.91L15.37 14.64C15.6365 14.3711 15.9774 14.1858 16.3496 14.1061C16.7219 14.0263 17.1115 14.0555 17.47 14.19C18.3772 14.5285 19.32 14.7634 20.28 14.89C20.7658 14.9585 21.2094 15.2032 21.5265 15.5775C21.8437 15.9518 22.0122 16.4296 22 16.92Z"
                stroke="white"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
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
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04097 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6054C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.06211 22.0329 6.39464C21.7563 5.72716 21.351 5.1208 20.84 4.61Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {favoriteBouquetIds.length > 0 ? (
            <span className={navStyles.favoriteBadge}>
              {favoriteBouquetIds.length}
            </span>
          ) : null}
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
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3 6H21"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {cartItemCount > 0 ? (
            <span className={navStyles.orderBadge} aria-hidden="true">
              {cartItemCount}
            </span>
          ) : null}
        </span>
        <span className={navStyles.label}>Мой заказ</span>
      </button>
    </nav>
  );
}
