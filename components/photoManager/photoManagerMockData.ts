// ==================================================
// SECTION: PHOTO MANAGER
// РАЗДЕЛ: Mock photo data (no DB, no upload)
// ==================================================
import type {
  PhotoManagerItem,
  PhotoManagerSummary,
} from "@/components/photoManager/photoManagerTypes";

export const PHOTO_MANAGER_MOCK_PHOTOS: PhotoManagerItem[] = [
  {
    id: "photo-01",
    photoNumber: 1,
    fileName: "white-roses-101.jpg",
    fileSizeLabel: "840 KB",
    isMain: true,
    placeholderLabel: "placeholder · белые розы",
    updatedAt: "2026-06-20T14:30:00.000Z",
  },
  {
    id: "photo-02",
    photoNumber: 2,
    fileName: "pink-peonies.jpg",
    fileSizeLabel: "720 KB",
    isMain: false,
    placeholderLabel: "placeholder · розовые пионы",
    updatedAt: "2026-06-21T09:15:00.000Z",
  },
  {
    id: "photo-03",
    photoNumber: 3,
    fileName: "hydrangea-mix.jpg",
    fileSizeLabel: "690 KB",
    isMain: false,
    placeholderLabel: "placeholder · гортензия",
    updatedAt: "2026-06-21T11:40:00.000Z",
  },
  {
    id: "photo-04",
    photoNumber: 4,
    fileName: "flower-basket.jpg",
    fileSizeLabel: "910 KB",
    isMain: false,
    placeholderLabel: "placeholder · корзина",
    updatedAt: "2026-06-22T16:05:00.000Z",
  },
  {
    id: "photo-05",
    photoNumber: 5,
    fileName: "red-roses-51.jpg",
    fileSizeLabel: "780 KB",
    isMain: false,
    placeholderLabel: "placeholder · красные розы",
    updatedAt: "2026-06-23T10:20:00.000Z",
  },
  {
    id: "photo-06",
    photoNumber: 6,
    fileName: "spring-collection.jpg",
    fileSizeLabel: "860 KB",
    isMain: false,
    placeholderLabel: "placeholder · весенняя коллекция",
    updatedAt: "2026-06-24T18:50:00.000Z",
  },
];

export function getPhotoManagerSummary(
  photos: PhotoManagerItem[],
): PhotoManagerSummary {
  const mainPhoto = photos.find((photo) => photo.isMain);

  return {
    totalPhotos: photos.length,
    mainPhotoFileName: mainPhoto?.fileName ?? "—",
    totalSizeLabel: "4.8 MB",
    lastUpdatedLabel: "24 июня 2026, 18:50",
  };
}
