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
};

export function Navbar({
  navigationItems,
  scrolled,
  elevated = false,
  onNavigate,
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
        <BrandLogo variant="nav" className={`logo ${styles.logo}`} />

        <div className="nav-center">
          {navigationItems.map((item) => (
            <a
              href={item.href}
              key={item.href}
              onClick={(event) => {
                if (!onNavigate) {
                  return;
                }

                event.preventDefault();
                onNavigate(item.href);
              }}
            >
              {item.label}
            </a>
          ))}
        </div>

        <button
          type="button"
          className={`menu-button ${styles.menuButton} ${menuOpen ? styles.menuButtonOpen : ""}`}
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? "mobile-navigation" : undefined}
        >
          <span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span>
          МЕНЮ
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
