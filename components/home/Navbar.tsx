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

export function Navbar({
  navigationItems,
  scrolled,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
}: NavbarProps) {
  return (
    <>
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="logo">BellaFlore</div>

        <div className="nav-center">
          {navigationItems.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </div>
        <button
          type="button"
          className="menu-button"
          onClick={onToggleMenu}
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
