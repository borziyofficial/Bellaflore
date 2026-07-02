// ==================================================
// SECTION: COURIERS
// РАЗДЕЛ: Курьеры
//
// Purpose (EN):
// React hook for browser geolocation in the courier workspace.
//
// Назначение (RU):
// React-хук геолокации браузера для рабочего места курьера.
// ==================================================
"use client";

import {
  getCourierLocation,
  saveCourierLocation,
} from "@/components/couriers/courierLocationStorage";
import type {
  CourierLocationRecord,
  CourierLocationStatus,
} from "@/components/couriers/courierLocationTypes";
import { useCallback, useState } from "react";


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN):
// Private helper functions used within this module.
//
// Назначение (RU):
// Приватные вспомогательные функции модуля.
// ==================================================
const MOCK_MOSCOW_LOCATION = {
  latitude: 55.7558,
  longitude: 37.6173,
};

const GEOLOCATION_TIMEOUT_MS = 15000;

type UseCourierGeolocationResult = {
  location: CourierLocationRecord | null;
  status: CourierLocationStatus | "idle";
  statusMessage: string;
  isRequesting: boolean;
  shareLocation: () => void;
  applyMockMoscowLocation: () => void;
};

function readInitialLocation(courierId: string): CourierLocationRecord | null {
  if (typeof window === "undefined" || !courierId.trim()) {
    return null;
  }

  return getCourierLocation(courierId);
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN):
// Public exported functions and constants.
//
// Назначение (RU):
// Публичные экспортируемые функции и константы.
// ==================================================
export function useCourierGeolocation(
  courierId: string,
  courierName: string,
): UseCourierGeolocationResult {
  const [location, setLocation] = useState<CourierLocationRecord | null>(() =>
    readInitialLocation(courierId),
  );
  const [status, setStatus] = useState<CourierLocationStatus | "idle">(() => {
    const storedLocation = readInitialLocation(courierId);
    return storedLocation?.status ?? "idle";
  });
  const [statusMessage, setStatusMessage] = useState(() => {
    const storedLocation = readInitialLocation(courierId);
    return storedLocation
      ? "Last shared location loaded from local storage."
      : "";
  });
  const [isRequesting, setIsRequesting] = useState(false);

  const shareLocation = useCallback(() => {
    if (!courierId.trim()) {
      setStatus("unavailable");
      setStatusMessage("Select a courier before sharing location.");
      return;
    }

    if (typeof window === "undefined" || !window.navigator.geolocation) {
      setStatus("unavailable");
      setStatusMessage("Browser geolocation is unavailable.");
      return;
    }

    setIsRequesting(true);
    setStatusMessage("Requesting browser geolocation permission…");

    window.navigator.geolocation.getCurrentPosition(
      (position) => {
        const capturedLocation: CourierLocationRecord = {
          courierId,
          courierName,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          capturedAt: new Date().toISOString(),
          source: "browser_geolocation",
          status: "active",
        };

        saveCourierLocation(capturedLocation);
        setLocation(capturedLocation);
        setStatus("active");
        setStatusMessage("Location active and saved locally.");
        setIsRequesting(false);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setStatus("permission_denied");
          setStatusMessage("Location permission denied.");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setStatus("unavailable");
          setStatusMessage("Location is unavailable.");
        } else if (error.code === error.TIMEOUT) {
          setStatus("error");
          setStatusMessage("Location request timed out.");
        } else {
          setStatus("error");
          setStatusMessage("Unable to capture courier location.");
        }

        setIsRequesting(false);
      },
      {
        enableHighAccuracy: true,
        timeout: GEOLOCATION_TIMEOUT_MS,
        maximumAge: 0,
      },
    );
  }, [courierId, courierName]);

  const applyMockMoscowLocation = useCallback(() => {
    if (!courierId.trim()) {
      setStatus("unavailable");
      setStatusMessage("Select a courier before using mock location.");
      return;
    }

    const mockLocation: CourierLocationRecord = {
      courierId,
      courierName,
      latitude: MOCK_MOSCOW_LOCATION.latitude,
      longitude: MOCK_MOSCOW_LOCATION.longitude,
      accuracy: 25,
      heading: null,
      speed: null,
      capturedAt: new Date().toISOString(),
      source: "manual_mock",
      status: "active",
    };

    saveCourierLocation(mockLocation);
    setLocation(mockLocation);
    setStatus("active");
    setStatusMessage("Mock Moscow location saved locally.");
  }, [courierId, courierName]);

  return {
    location,
    status,
    statusMessage,
    isRequesting,
    shareLocation,
    applyMockMoscowLocation,
  };
}
