"use client";

import { usePhotoManager } from "@/components/photoManager/PhotoManagerProvider";
import styles from "@/components/photoManager/AiSeoAssistantFoundation.module.css";

const AI_FEATURES = [
  "авто ALT",
  "авто filename",
  "авто caption",
  "авто description",
  "авто keywords",
  "local SEO phrase",
];

export function AiSeoAssistantFoundation() {
  const { selectedPhoto, applyAiSeoToSelected } = usePhotoManager();

  return (
    <section className={styles.panel}>
      <h4 className={styles.title}>🤖 AI SEO Assistant</h4>
      <ul className={styles.list}>
        {AI_FEATURES.map((feature) => (
          <li key={feature} className={styles.item}>
            · {feature}
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={styles.generateButton}
        disabled={!selectedPhoto}
        onClick={applyAiSeoToSelected}
      >
        Сгенерировать SEO
      </button>
      <p className={styles.note}>
        Локальная mock-логика без OpenAI/API. Применяет SEO-рекомендации к выбранному
        фото.
      </p>
    </section>
  );
}
