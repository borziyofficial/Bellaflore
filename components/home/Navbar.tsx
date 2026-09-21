// ==================================================
// SECTION: NAVBAR
// РАЗДЕЛ: Навигация
// ==================================================
"use client";

import { BrandLogo } from "@/components/brand/BrandLogo";
import styles from "@/components/home/Navbar.module.css";
import { useEffect, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

type NavigationItem = {
  href: string;
  label: string;
};

type NavbarProps = {
  navigationItems: NavigationItem[];
  scrolled: boolean;
  elevated?: boolean;
  onNavigate?: (href: string) => void;
  cartItemCount?: number;
  onCartClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
};

export function Navbar({
  navigationItems,
  scrolled,
  elevated = false,
  onNavigate,
  cartItemCount = 0,
  onCartClick,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [menuOpen]);

  const handleNavigate = (href: string) => {
    setMenuOpen(false);

    if (onNavigate) {
      onNavigate(href);
    }
  };

  return (
    <>
      <nav
        className={`navbar ${styles.navbar} ${menuOpen ? styles.navbarMenuOpen : ""} ${scrolled ? "scrolled" : ""} ${elevated ? "navbar-elevated" : ""}`}
      >
        <button
          type="button"
          className={`${styles.iconButton} ${styles.menuButton} ${menuOpen ? styles.menuButtonOpen : ""}`}
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? "mobile-navigation" : undefined}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            {menuOpen ? (
              <path
                d="M6 6L18 18M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M4 7H20M4 12H20M4 17H20"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>

        <BrandLogo variant="nav" className={`logo ${styles.logo}`} />

        <button
          type="button"
          className={styles.iconButton}
          onClick={onCartClick}
          aria-label={
            cartItemCount > 0
              ? `Мой заказ, ${cartItemCount} товаров`
              : "Мой заказ"
          }
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3 6H21"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={styles.cartCount}>({cartItemCount})</span>
        </button>
      </nav>
      {menuOpen ? (
        <>
          <div
            className={`menu-overlay ${styles.menuOverlay}`}
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            className={`mobile-menu ${styles.mobileMenu}`}
            id="mobile-navigation"
            role="navigation"
            aria-label="Мобильное меню"
            onClick={(event) => event.stopPropagation()}
          >
            {navigationItems.map((item) => (
              <a
                href={item.href}
                key={item.href}
                className={styles.mobileMenuLink}
                onClick={(event) => {
                  event.preventDefault();
                  handleNavigate(item.href);
                }}
              >
                {item.label}
              </a>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
