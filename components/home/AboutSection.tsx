// ==================================================
// SECTION: ABOUT
// РАЗДЕЛ: О бренде
//
// Purpose (EN):
// About section with brand story
//
// Назначение (RU):
// Секция «О нас» с историей бренда
// ==================================================
import styles from "@/components/home/AboutSection.module.css";

export function AboutSection() {
  return (
    <section id="about" className={styles.section} aria-labelledby="about-title">
      <div className={styles.shell}>
        <div className={`bf-reveal bf-reveal-up ${styles.intro}`}>
          <p className={styles.kicker}>О BellaFlore</p>
          <h2 id="about-title">Красота, собранная с намерением</h2>
          <div className={styles.signature} aria-hidden="true">
            BF
          </div>
        </div>

        <div className={`bf-reveal bf-reveal-up ${styles.story}`}>
          <p className={styles.lead}>
            Мы создаём букеты, которые говорят за вас — деликатно, точно и
            без лишних слов.
          </p>
          <p>
            BellaFlore — московская студия авторской флористики. Мы отбираем
            цветы вручную, собираем каждую композицию под настроение повода и
            бережно доставляем её получателю.
          </p>
          <a href="#catalog" className={styles.storyLink}>
            Познакомиться с коллекцией <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>

      <div className={`bf-reveal-stagger ${styles.values}`}>
        <article className="bf-reveal-up">
          <span>01</span>
          <h3>Свежесть</h3>
          <p>Выбираем цветы у проверенных поставщиков и храним в правильных условиях.</p>
        </article>
        <article className="bf-reveal-up">
          <span>02</span>
          <h3>Авторский подход</h3>
          <p>Не повторяем шаблоны — каждый букет собирается флористом вручную.</p>
        </article>
        <article className="bf-reveal-up">
          <span>03</span>
          <h3>Деликатный сервис</h3>
          <p>Уточняем детали, согласовываем время и остаёмся на связи до вручения.</p>
        </article>
      </div>
    </section>
  );
}
