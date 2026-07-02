// ==================================================
// SECTION: NAVBAR
// РАЗДЕЛ: Навигация
// ==================================================
"use client";

import { BrandLogo } from "@/components/brand/BrandLogo";
import styles from "@/components/home/Navbar.module.css";
import {
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
  useRef,
} from "react";

type NavigationItem = {
  href: string;
  label: string;
};

type NavbarProps = {
  navigationItems: NavigationItem[];
  scrolled: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onNavigate?: (href: string) => void;
};

export function Navbar({
  navigationItems,
  scrolled,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onNavigate,
}: NavbarProps) {
  const lastMenuTouchRef = useRef(0);

  const handleMenuClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (
      lastMenuTouchRef.current > 0 &&
      event.timeStamp - lastMenuTouchRef.current < 450
    ) {
      return;
    }

    onToggleMenu();
  };

  const handleMenuTouchEnd = (event: ReactTouchEvent<HTMLButtonElement>) => {
    event.preventDefault();
    lastMenuTouchRef.current = event.timeStamp;
    onToggleMenu();
  };

  return (
    <>
      <nav className={`navbar ${styles.navbar} ${scrolled ? "scrolled" : ""}`}>
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
          className={`menu-button ${styles.menuButton}`}
          onClick={handleMenuClick}
          onTouchEnd={handleMenuTouchEnd}
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
        >
          <span aria-hidden="true">{menuOpen ? "✕" : "≡"}</span>
          МЕНЮ
        </button>
      </nav>
      {menuOpen && (
        <>
          <div className="menu-overlay" onClick={onCloseMenu} />
          <div className={`mobile-menu ${styles.mobileMenu}`} id="mobile-navigation">
            {navigationItems.map((item) => (
              <a
                href={item.href}
                key={item.href}
                onClick={(event) => {
                  if (onNavigate) {
                    event.preventDefault();
                    onNavigate(item.href);
                  }

                  onCloseMenu();
                }}
              >
                {item.label}
              </a>
            ))}
          </div>
        </>
      )}
    </>
  );
}
