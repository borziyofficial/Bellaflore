// ==================================================
// SECTION: PHOTO MANAGER
// РАЗДЕЛ: Client-side photo store (no API / no DB)
// ==================================================
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { applyMockAiSeoSuggestions } from "@/components/photoManager/photoManagerSeoFoundation";
import {
  createPhotoUploadItemFromFile,
  getMainPhoto,
  isAcceptedPhotoFile,
  movePhoto,
  renumberPhotos,
  revokePhotoObjectUrls,
  setMainPhoto,
} from "@/components/photoManager/photoManagerUploadEngine";
import type {
  PhotoImageSeo,
  PhotoUploadItem,
} from "@/components/photoManager/photoManagerTypes";

type PhotoManagerContextValue = {
  photos: PhotoUploadItem[];
  selectedPhotoId: string | null;
  selectedPhoto: PhotoUploadItem | null;
  mainPhoto: PhotoUploadItem | null;
  uploadFiles: (files: FileList | File[]) => void;
  selectPhoto: (photoId: string) => void;
  setMain: (photoId: string) => void;
  removePhoto: (photoId: string) => void;
  movePhotoUp: (photoId: string) => void;
  movePhotoDown: (photoId: string) => void;
  updatePhotoSeo: (photoId: string, patch: Partial<PhotoImageSeo>) => void;
  applyAiSeoToSelected: () => void;
  replacePhotos: (photos: PhotoUploadItem[]) => void;
};

const PhotoManagerContext = createContext<PhotoManagerContextValue | null>(null);

export function PhotoManagerProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<PhotoUploadItem[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const photosRef = useRef<PhotoUploadItem[]>([]);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    return () => {
      revokePhotoObjectUrls(photosRef.current);
    };
  }, []);

  const selectedPhoto = useMemo(
    () => photos.find((photo) => photo.id === selectedPhotoId) ?? null,
    [photos, selectedPhotoId],
  );

  const mainPhoto = useMemo(() => getMainPhoto(photos), [photos]);

  const uploadFiles = useCallback((files: FileList | File[]) => {
    const incoming = Array.from(files).filter(isAcceptedPhotoFile);
    if (incoming.length === 0) {
      return;
    }

    setPhotos((current) => {
      const hasMain = current.some((photo) => photo.isMain);
      const startNumber = current.length + 1;

      const uploaded = incoming.map((file, index) =>
        createPhotoUploadItemFromFile(
          file,
          startNumber + index,
          !hasMain && index === 0 && current.length === 0,
        ),
      );

      const nextPhotos =
        current.length === 0 && uploaded.length > 0
          ? uploaded.map((photo, index) => ({
              ...photo,
              isMain: index === 0,
            }))
          : [...current, ...uploaded.map((photo) => ({ ...photo, isMain: false }))];

      const renumbered = renumberPhotos(nextPhotos);
      const firstNewId = uploaded[0]?.id;
      if (firstNewId) {
        setSelectedPhotoId(firstNewId);
      }

      return renumbered;
    });
  }, []);

  const selectPhoto = useCallback((photoId: string) => {
    setSelectedPhotoId(photoId);
  }, []);

  const setMain = useCallback((photoId: string) => {
    setPhotos((current) => setMainPhoto(current, photoId));
    setSelectedPhotoId(photoId);
  }, []);

  const removePhoto = useCallback((photoId: string) => {
    setPhotos((current) => {
      const target = current.find((photo) => photo.id === photoId);
      if (target) {
        URL.revokeObjectURL(target.objectUrl);
      }

      const remaining = current.filter((photo) => photo.id !== photoId);
      const renumbered = renumberPhotos(remaining);

      if (renumbered.length === 0) {
        setSelectedPhotoId(null);
        return renumbered;
      }

      const hadMain = target?.isMain;
      let nextPhotos = renumbered;

      if (hadMain || !renumbered.some((photo) => photo.isMain)) {
        nextPhotos = setMainPhoto(renumbered, renumbered[0].id);
      }

      setSelectedPhotoId((currentSelected) => {
        if (currentSelected === photoId) {
          return nextPhotos[0]?.id ?? null;
        }

        return currentSelected;
      });

      return nextPhotos;
    });
  }, []);

  const movePhotoUp = useCallback((photoId: string) => {
    setPhotos((current) => movePhoto(current, photoId, "up"));
  }, []);

  const movePhotoDown = useCallback((photoId: string) => {
    setPhotos((current) => movePhoto(current, photoId, "down"));
  }, []);

  const updatePhotoSeo = useCallback(
    (photoId: string, patch: Partial<PhotoImageSeo>) => {
      setPhotos((current) =>
        current.map((photo) =>
          photo.id === photoId
            ? { ...photo, seo: { ...photo.seo, ...patch } }
            : photo,
        ),
      );
    },
    [],
  );

  const applyAiSeoToSelected = useCallback(() => {
    if (!selectedPhotoId) {
      return;
    }

    setPhotos((current) =>
      current.map((photo) =>
        photo.id === selectedPhotoId ? applyMockAiSeoSuggestions(photo) : photo,
      ),
    );
  }, [selectedPhotoId]);

  const replacePhotos = useCallback((incoming: PhotoUploadItem[]) => {
    setPhotos((current) => {
      revokePhotoObjectUrls(current.filter((photo) => photo.objectUrl));
      return incoming;
    });
    setSelectedPhotoId(incoming[0]?.id ?? null);
  }, []);

  const value = useMemo(
    () => ({
      photos,
      selectedPhotoId,
      selectedPhoto,
      mainPhoto,
      uploadFiles,
      selectPhoto,
      setMain,
      removePhoto,
      movePhotoUp,
      movePhotoDown,
      updatePhotoSeo,
      applyAiSeoToSelected,
      replacePhotos,
    }),
    [
      photos,
      selectedPhotoId,
      selectedPhoto,
      mainPhoto,
      uploadFiles,
      selectPhoto,
      setMain,
      removePhoto,
      movePhotoUp,
      movePhotoDown,
      updatePhotoSeo,
      applyAiSeoToSelected,
      replacePhotos,
    ],
  );

  return (
    <PhotoManagerContext.Provider value={value}>{children}</PhotoManagerContext.Provider>
  );
}

export function usePhotoManager(): PhotoManagerContextValue {
  const context = useContext(PhotoManagerContext);

  if (!context) {
    throw new Error("usePhotoManager must be used within PhotoManagerProvider");
  }

  return context;
}

export function usePhotoManagerOptional(): PhotoManagerContextValue | null {
  return useContext(PhotoManagerContext);
}
