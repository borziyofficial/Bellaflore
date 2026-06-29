// ==================================================
// SECTION: PHOTO MANAGER
// РАЗДЕЛ: Photo Upload Engine + SEO Image Core
// ==================================================
"use client";

import { useMemo } from "react";
import { AiSeoAssistantFoundation } from "@/components/photoManager/AiSeoAssistantFoundation";
import { ImageOptimizerFoundation } from "@/components/photoManager/ImageOptimizerFoundation";
import { PhotoGallery } from "@/components/photoManager/PhotoGallery";
import styles from "@/components/photoManager/PhotoManagerFoundation.module.css";
import { usePhotoManager } from "@/components/photoManager/PhotoManagerProvider";
import { buildPhotoManagerSummary } from "@/components/photoManager/photoManagerUploadEngine";
import { PhotoPreview } from "@/components/photoManager/PhotoPreview";
import { PhotoSeoPanel } from "@/components/photoManager/PhotoSeoPanel";
import { PhotoToolbar } from "@/components/photoManager/PhotoToolbar";
import { PHOTO_MANAGER_SECTION_ID } from "@/components/photoManager/photoManagerTypes";

export function PhotoManagerFoundation() {
  const { photos, selectPhoto } = usePhotoManager();

  const summary = useMemo(() => buildPhotoManagerSummary(photos), [photos]);

  const handleEditSeo = (photoId: string) => {
    selectPhoto(photoId);
    document.getElementById("photo-seo-panel")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section id={PHOTO_MANAGER_SECTION_ID} className={styles.section}>
      <p className={styles.eyebrow}>Stage 47 · Photo Upload Engine + SEO Image Core</p>
      <h3 className={styles.title}>🖼 Фото товара</h3>
      <p className={styles.lead}>
        Локальный upload engine с SEO Image Core: objectURL preview, reorder, главное
        фото и checklist без API, БД и public catalog wiring.
      </p>

      <PhotoToolbar />

      <div className={styles.workspace}>
        <div className={styles.galleryColumn}>
          <PhotoGallery onEditSeo={handleEditSeo} />
        </div>

        <div className={styles.sideColumn}>
          <PhotoPreview />
          <PhotoSeoPanel />
        </div>
      </div>

      <div className={styles.foundationGrid}>
        <ImageOptimizerFoundation />
        <AiSeoAssistantFoundation />
      </div>

      <div className={styles.summaryGrid}>
        <article className={styles.summaryItem}>
          <p className={styles.summaryLabel}>Фото всего</p>
          <p className={styles.summaryValue}>{summary.totalPhotos}</p>
        </article>
        <article className={styles.summaryItem}>
          <p className={styles.summaryLabel}>Главное фото</p>
          <p className={styles.summaryValue}>{summary.mainPhotoFileName}</p>
        </article>
        <article className={styles.summaryItem}>
          <p className={styles.summaryLabel}>Общий размер</p>
          <p className={styles.summaryValue}>{summary.totalSizeLabel}</p>
        </article>
        <article className={styles.summaryItem}>
          <p className={styles.summaryLabel}>Последнее изменение</p>
          <p className={styles.summaryValue}>{summary.lastUpdatedLabel}</p>
        </article>
      </div>
    </section>
  );
}
