"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

const bouquets = [
  {
    src: "/roza rouze royal.PNG",
    alt: "Букет Red Luxury из красных роз",
    title: "Red Luxury",
    description: "51 красная роза",
    width: 1122,
    height: 1402,
  },
  {
    src: "/0002.PNG",
    alt: "Авторский букет Pink Elegance в розовой гамме",
    title: "Pink Elegance",
    description: "Премиальный авторский букет",
    width: 1086,
    height: 1448,
  },
  {
    src: "/white rose 101.PNG",
    alt: "Букет White Pearl из белых роз",
    title: "White Pearl",
    description: "101 белая роза",
    width: 1109,
    height: 1418,
  },
  {
    src: "/0009.PNG",
    alt: "Авторский букет Golden Romance",
    title: "Golden Romance",
    description: "Авторский премиальный букет",
    width: 1136,
    height: 1384,
  },
  {
    src: "/mix piony siren.PNG",
    alt: "Композиция Luxury Box с пионами",
    title: "Luxury Box",
    description: "Пионы в премиальной коробке",
    width: 1023,
    height: 1537,
  },
  {
    src: "/piony 11.PNG",
    alt: "Цветочная композиция Royal Collection",
    title: "Royal Collection",
    description: "Эксклюзивная цветочная композиция",
    width: 1254,
    height: 1254,
  },
];

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
        <div className="bouquet-grid">
          {bouquets.map((bouquet) => (
            <div className="bouquet-card" key={bouquet.title}>
              <div className="bouquet-image">
                <Image
                  src={bouquet.src}
                  alt={bouquet.alt}
                  width={bouquet.width}
                  height={bouquet.height}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div className="bouquet-info">
                <h3>{bouquet.title}</h3>
                <p>{bouquet.description}</p>
                <a className="buy-button bouquet-order-link" href="#contact">
                  Заказать
                </a>
              </div>
            </div>
          ))}
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
