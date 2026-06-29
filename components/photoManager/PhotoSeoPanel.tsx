"use client";

import { useMemo } from "react";
import { usePhotoManager } from "@/components/photoManager/PhotoManagerProvider";
import { buildPhotoImageSeoScore } from "@/components/photoManager/photoManagerSeoFoundation";
import styles from "@/components/photoManager/PhotoSeoPanel.module.css";

export function PhotoSeoPanel() {
  const { selectedPhoto, mainPhoto, photos, updatePhotoSeo } = usePhotoManager();
  const editingPhoto = selectedPhoto ?? mainPhoto;

  const seoScore = useMemo(
    () => buildPhotoImageSeoScore(editingPhoto, Boolean(mainPhoto)),
    [editingPhoto, mainPhoto],
  );

  if (!editingPhoto) {
    return (
      <section className={styles.panel}>
        <h4 className={styles.panelTitle}>🚀 SEO изображения</h4>
        <p className={styles.emptyNote}>
          Загрузите и выберите фото, чтобы редактировать SEO Image Core.
        </p>
      </section>
    );
  }

  const handleChange = (field: keyof typeof editingPhoto.seo, value: string) => {
    updatePhotoSeo(editingPhoto.id, { [field]: value });
  };

  return (
    <section className={styles.panel} id="photo-seo-panel">
      <h4 className={styles.panelTitle}>🚀 SEO изображения</h4>

      <div className={styles.scoreCard}>
        <p className={styles.scoreLabel}>SEO готовность изображения</p>
        <p className={styles.scoreValue}>{seoScore.score} / 100</p>
        <p className={styles.scoreGoal}>
          Цель: максимальная SEO-готовность изображений Bellaflore
        </p>
      </div>

      <ul className={styles.checklist}>
        {seoScore.checklist.map((item) => (
          <li
            key={item.id}
            className={`${styles.checklistItem} ${
              item.passed ? styles.checklistItemPassed : ""
            }`}
          >
            <span className={styles.checkMark}>{item.passed ? "✓" : "○"}</span>
            {item.label}
          </li>
        ))}
      </ul>

      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          <span className={styles.label}>Image Title</span>
          <input
            className={styles.input}
            value={editingPhoto.seo.imageTitle}
            onChange={(event) => handleChange("imageTitle", event.target.value)}
          />
        </label>

        <label className={`${styles.field} ${styles.fieldFull}`}>
          <span className={styles.label}>Image Alt</span>
          <input
            className={styles.input}
            value={editingPhoto.seo.imageAlt}
            onChange={(event) => handleChange("imageAlt", event.target.value)}
          />
        </label>

        <label className={`${styles.field} ${styles.fieldFull}`}>
          <span className={styles.label}>Image Caption</span>
          <textarea
            className={styles.textarea}
            value={editingPhoto.seo.imageCaption}
            onChange={(event) => handleChange("imageCaption", event.target.value)}
          />
        </label>

        <label className={`${styles.field} ${styles.fieldFull}`}>
          <span className={styles.label}>Image Description</span>
          <textarea
            className={styles.textarea}
            value={editingPhoto.seo.imageDescription}
            onChange={(event) =>
              handleChange("imageDescription", event.target.value)
            }
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>SEO Filename</span>
          <input
            className={styles.input}
            value={editingPhoto.seo.seoFilename}
            onChange={(event) => handleChange("seoFilename", event.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Canonical Image URL</span>
          <input
            className={styles.input}
            value={editingPhoto.seo.canonicalImageUrl}
            onChange={(event) =>
              handleChange("canonicalImageUrl", event.target.value)
            }
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>OpenGraph Image</span>
          <input
            className={styles.input}
            value={editingPhoto.seo.openGraphImage}
            onChange={(event) => handleChange("openGraphImage", event.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Twitter Image</span>
          <input
            className={styles.input}
            value={editingPhoto.seo.twitterImage}
            onChange={(event) => handleChange("twitterImage", event.target.value)}
          />
        </label>

        <label className={`${styles.field} ${styles.fieldFull}`}>
          <span className={styles.label}>Image Keywords</span>
          <input
            className={styles.input}
            value={editingPhoto.seo.imageKeywords}
            onChange={(event) => handleChange("imageKeywords", event.target.value)}
          />
        </label>

        <label className={`${styles.field} ${styles.fieldFull}`}>
          <span className={styles.label}>Local SEO Phrase</span>
          <input
            className={styles.input}
            value={editingPhoto.seo.localSeoPhrase}
            onChange={(event) => handleChange("localSeoPhrase", event.target.value)}
          />
        </label>
      </div>

      <p className={styles.emptyNote}>
        Редактируется фото: {editingPhoto.fileName} · всего в галерее: {photos.length}
      </p>
    </section>
  );
}
