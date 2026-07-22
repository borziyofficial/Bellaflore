// ==================================================
// SECTION: NAVBAR
// РАЗДЕЛ: Навигация
// ==================================================
"use client";

import { BrandLogo } from "@/components/brand/BrandLogo";
import styles from "@/components/home/Navbar.module.css";
import { useEffect, useState } from "react";

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
  onCartClick?: () => void;
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
          className={`menu-button ${styles.menuButton} ${menuOpen ? styles.menuButtonOpen : ""}`}
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? "mobile-navigation" : undefined}
        >
          <span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span>
        </button>

        <BrandLogo variant="nav" className={`logo ${styles.logo}`} />

        <button
          type="button"
          className={styles.cartButton}
          onClick={onCartClick}
          aria-label="Открыть корзину"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.cartIcon}>
            <path
              d="M6 7h14l-1.4 9.1a2 2 0 0 1-2 1.7H8.4a2 2 0 0 1-2-1.7L5 4H2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="9.5" cy="20.5" r="1.4" fill="currentColor" />
            <circle cx="17.5" cy="20.5" r="1.4" fill="currentColor" />
          </svg>
          {cartItemCount > 0 ? (
            <span className={styles.cartBadge}>{cartItemCount > 9 ? "9+" : cartItemCount}</span>
          ) : null}
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
