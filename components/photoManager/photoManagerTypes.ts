// ==================================================
// SECTION: PHOTO MANAGER
// РАЗДЕЛ: Upload + SEO image types
// ==================================================

export type PhotoImageSeo = {
  imageTitle: string;
  imageAlt: string;
  imageCaption: string;
  imageDescription: string;
  seoFilename: string;
  canonicalImageUrl: string;
  openGraphImage: string;
  twitterImage: string;
  imageKeywords: string;
  localSeoPhrase: string;
};

export type PhotoUploadItem = {
  id: string;
  photoNumber: number;
  fileName: string;
  fileSizeBytes: number;
  fileSizeLabel: string;
  fileFormat: string;
  objectUrl: string;
  isMain: boolean;
  seo: PhotoImageSeo;
  uploadedAt: string;
  placeholderLabel?: string;
};

export type PhotoManagerProductContext = {
  productName: string;
  category: string;
  city: string;
  brand: string;
  intent: string;
};

export type PhotoImageSeoChecklistItem = {
  id: string;
  label: string;
  passed: boolean;
};

export type PhotoImageSeoScore = {
  score: number;
  checklist: PhotoImageSeoChecklistItem[];
};

export const PHOTO_MANAGER_SECTION_ID = "photo-manager";

export type PhotoManagerSummary = {
  totalPhotos: number;
  mainPhotoFileName: string;
  totalSizeLabel: string;
  lastUpdatedLabel: string;
};

/** @deprecated Stage 47 uses PhotoUploadItem */
export type PhotoManagerItem = {
  id: string;
  photoNumber: number;
  fileName: string;
  fileSizeLabel: string;
  isMain: boolean;
  placeholderLabel: string;
  updatedAt: string;
};
