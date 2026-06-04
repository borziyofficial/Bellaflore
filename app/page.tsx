"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {/* ---- НАВБАР ---- */}
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="logo">BellaFlore</div>

        <div className="nav-center">
          <a href="#">ГЛАВНАЯ</a>
          <a href="#collections">КОЛЛЕКЦИИ</a>
          <a href="#delivery">ДОСТАВКА</a>
          <a href="#about">О НАС</a>
          <a href="#contact">КОНТАКТЫ</a>
        </div>

        <button
          className="menu-button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Открыть меню"
          aria-expanded={menuOpen}
        >
          {menuOpen ? "✕" : "≡"} МЕНЮ
        </button>
      </nav>

      {/* ---- МОБИЛЬНОЕ МЕНЮ ---- */}
      {menuOpen && (
        <>
          <div className="menu-overlay" onClick={closeMenu} />
          <div className="mobile-menu">
            <a href="#" onClick={closeMenu}>ГЛАВНАЯ</a>
            <a href="#collections" onClick={closeMenu}>КОЛЛЕКЦИИ</a>
            <a href="#delivery" onClick={closeMenu}>ДОСТАВКА</a>
            <a href="#about" onClick={closeMenu}>О НАС</a>
            <a href="#contact" onClick={closeMenu}>КОНТАКТЫ</a>
          </div>
        </>
      )}

      {/* ---- HERO ---- */}
      <main className="hero">
        <div className="hero-content">
          <h1 className="hero-title">BellaFlore</h1>
          <p className="hero-subtitle">
            Премиальная доставка цветов для особых моментов
          </p>
          <a className="buy-button hero-order-link" href="#contact">
            Заказать букет
          </a>
        </div>
      </main>

      {/* ---- ДОСТАВКА ---- */}
      <section id="delivery" className="delivery">
        <div className="section-header">
          <span>Доставка</span>
          <h2>Как мы работаем</h2>
        </div>
        <div className="delivery-grid">
          <div className="delivery-card">
            <h3>Быстрая доставка</h3>
            <p>Доставим букет в течение 60–120 минут.</p>
          </div>
          <div className="delivery-card">
            <h3>24/7</h3>
            <p>Принимаем заказы круглосуточно.</p>
          </div>
          <div className="delivery-card">
            <h3>Фото перед отправкой</h3>
            <p>Отправим фотографию готового букета.</p>
          </div>
        </div>
      </section>

      {/* ---- КОЛЛЕКЦИИ БУКЕТОВ ---- */}
      <section id="collections" className="bouquets">
        <div className="section-header">
          <span>Коллекции</span>
          <h2>Наши букеты</h2>
        </div>
{/* ----------------buketi 1-------------*/}
        <div className="bouquet-grid">
          <div className="bouquet-card">
            <img src="/roza rouze royal.PNG" alt="Red Luxury" />
            <div className="bouquet-info">
              <h3>Red Luxury</h3>
              <p>51 красная роза</p>
              <button className="buy-button">Заказать</button>
            </div>
          </div>
{/* ----------------buketi 2-------------*/}
          <div className="bouquet-card">
            <img src="/0002.PNG" alt="Pink Elegance" />
            <div className="bouquet-info">
              <h3>Pink Elegance</h3>
              <p>Премиальная авторскаяи букет</p>
              <button className="buy-button">Заказать</button>
            </div>
          </div>
{/* ----------------buketi 3-------------*/}
          <div className="bouquet-card">
            <img src="/white rose 101.PNG" alt="White Pearl" />
            <div className="bouquet-info">
              <h3>White Pearl</h3>
              <p>101 белая роза</p>
              <button className="buy-button">Заказать</button>
            </div>
          </div>
{/* ----------------buketi 4-------------*/}
          <div className="bouquet-card">
            <img src="/0009.PNG" alt="Golden Romance" />
            <div className="bouquet-info">
              <h3>Golden Romance</h3>
              <p>Авторский премиальный букет</p>
              <button className="buy-button">Заказать</button>
            </div>
          </div>
{/* ----------------buketi 5-------------*/}
          <div className="bouquet-card">
            <img src="/mix piony siren.PNG" alt="Luxury Box" />
            <div className="bouquet-info">
              <h3>Luxury Box</h3>
              <p>Пионы в премиальной коробке</p>
              <button className="buy-button">Заказать</button>
            </div>
          </div>
{/* ----------------buketi 6-------------*/}
          <div className="bouquet-card">
            <img src="/piony 11.PNG" alt="Royal Collection" />
            <div className="bouquet-info">
              <h3>Royal Collection</h3>
              <p>Эксклюзивная цветочная композиция</p>
              <button className="buy-button">Заказать</button>
            </div>
          </div>
        </div>
      </section>

      {/* ---- О НАС ---- */}
      <section id="about" className="about">
        <div className="section-header">
          <span>О нас</span>
          <h2>BellaFlore</h2>
        </div>
        <div className="about-card">
          <p>
            BellaFlore — премиальная доставка цветов в Москве.
            Мы создаём авторские композиции из свежих цветов
            и доставляем их для самых важных моментов вашей жизни.
          </p>
        </div>
      </section>

      {/* ---- КОНТАКТЫ ---- */}
      <section id="contact" className="contact">
        <div className="section-header">
          <span>Контакты</span>
          <h2>Свяжитесь с нами</h2>
        </div>
        <div className="contact-card">
          <p className="contact-intro">
            BellaFlore готовится к запуску. Скоро здесь появятся актуальные
            контакты для заказов, консультаций и доставки.
          </p>
          <div className="contact-grid">
            <div className="contact-link">
              <span>Статус</span>
              Скоро открытие
            </div>
            <div className="contact-link">
              <span>Заказы</span>
              Приём заказов начнётся после запуска
            </div>
            <div className="contact-link">
              <span>Контакты</span>
              Реальные контакты будут добавлены позже
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
