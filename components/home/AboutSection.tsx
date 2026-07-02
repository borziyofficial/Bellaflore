// ==================================================
// SECTION: HERO
// РАЗДЕЛ: Главный экран
//
// Purpose (EN):
// About section with brand story
//
// Назначение (RU):
// Секция «О нас» с историей бренда
// ==================================================
export function AboutSection() {
  return (
    <section id="about" className="about">
      {/* ==================================================
SECTION: HERO
РАЗДЕЛ: Заголовок секции
Purpose (EN): Section header
Назначение (RU): Заголовок секции
================================================== */}
      <div className="section-header bf-reveal bf-reveal-up">
        <span>О нас</span>
        <h2>BellaFlore</h2>
      </div>
      {/* ==================================================
SECTION: HERO
РАЗДЕЛ: Карточка с описанием бренда
Purpose (EN): Brand story card
Назначение (RU): Карточка с описанием бренда
================================================== */}
      <div className="about-card bf-reveal bf-reveal-up">
        <p>
          BellaFlore — премиальная доставка цветов в Москве.
          Мы создаём авторские композиции из свежих цветов
          и доставляем их для самых важных моментов вашей жизни.
        </p>
      </div>
    </section>
  );
}
