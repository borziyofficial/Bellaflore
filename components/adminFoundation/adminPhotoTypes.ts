// ==================================================
// SECTION: ADMIN FOUNDATION
// РАЗДЕЛ: Photo Manager types
// ==================================================

export type AdminPhotoItem = {
  id: string;
  fileName: string;
  previewUrl: string;
  mimeType: string;
  sizeBytes: number;
  isMain: boolean;
  createdAt: string;
};
