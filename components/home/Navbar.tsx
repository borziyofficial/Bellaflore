// ==================================================
// SECTION: NAVBAR
// РАЗДЕЛ: Навигация
//
// Purpose (EN):
// Top navigation bar with desktop links and mobile menu
//
// Назначение (RU):
// Верхняя навигация с десктоп-ссылками и мобильным меню
// ==================================================
"use client";

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
};

import { BrandLogo } from "@/components/brand/BrandLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function Navbar({
  navigationItems,
  scrolled,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
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
      {/* ==================================================
SECTION: NAVBAR
РАЗДЕЛ: Логотип, ссылки и кнопка меню
Purpose (EN): Logo, center links, and menu toggle
Назначение (RU): Логотип, ссылки и кнопка меню
================================================== */}
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <BrandLogo variant="nav" className="logo" />

        <div className="nav-center">
          {navigationItems.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </div>
        <ThemeToggle />
        <button
          type="button"
          className="menu-button"
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
          {/* ==================================================
SECTION: OVERLAYS
РАЗДЕЛ: Фон и выезжающее мобильное меню
Purpose (EN): Mobile menu backdrop and slide-out links
Назначение (RU): Фон и выезжающее мобильное меню
================================================== */}
          <div className="menu-overlay" onClick={onCloseMenu} />
          <div className="mobile-menu" id="mobile-navigation">
            {navigationItems.map((item) => (
              <a href={item.href} key={item.href} onClick={onCloseMenu}>
                {item.label}
              </a>
            ))}
          </div>
        </>
      )}
    </>
  );
}
