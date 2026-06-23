export function ContactSection() {
  return (
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
  );
}
