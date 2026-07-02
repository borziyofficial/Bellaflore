// ==================================================
// SECTION: MAPS
// РАЗДЕЛ: Карты
//
// Purpose (EN): Geocoding, routing, ETA, and Yandex Maps provider integration.
//
// Назначение (RU): Геокодирование, маршруты, ETA и интеграция с Yandex Maps.
// ==================================================
export type YandexMapBounds = [number, number][];

export type YandexGeoObjectCollection = {
  add: (geoObject: YandexGeoObject) => void;
  remove: (geoObject: YandexGeoObject) => void;
  removeAll: () => void;
  getBounds: () => YandexMapBounds | null;
};

export type YandexMapEvent = {
  get: (key: string) => unknown;
};

export type YandexMapEvents = {
  add: (event: string, handler: (event: YandexMapEvent) => void) => void;
};

export type YandexMap = {
  geoObjects: YandexGeoObjectCollection;
  setCenter: (center: [number, number], zoom?: number) => void;
  setBounds: (
    bounds: YandexMapBounds,
    options?: {
      checkZoomRange?: boolean;
      zoomMargin?: number | number[];
    },
  ) => void;
  destroy: () => void;
  events: YandexMapEvents;
  container?: {
    fitToViewport: () => void;
  };
};

export type YandexPlacemarkProperties = {
  hintContent?: string;
  balloonContentHeader?: string;
  balloonContentBody?: string;
};

export type YandexPlacemarkOptions = {
  preset?: string;
  iconColor?: string;
  iconLayout?: string;
  iconImageHref?: string;
  iconImageSize?: [number, number];
  iconImageOffset?: [number, number];
};

export type YandexPlacemarkEvents = {
  add: (event: string, handler: (event?: YandexMapEvent) => void) => void;
};

export type YandexPlacemark = {
  events: YandexPlacemarkEvents;
  balloon: {
    open: () => void;
  };
};

export type YandexPolylineOptions = {
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
};

export type YandexPolyline = {
  events: YandexPlacemarkEvents;
};

export type YandexPolygonOptions = {
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  fillOpacity?: number;
  strokeOpacity?: number;
  zIndex?: number;
  openBalloonOnClick?: boolean;
  interactivityModel?: string;
};

export type YandexPolygonProperties = {
  hintContent?: string;
  balloonContentHeader?: string;
  balloonContentBody?: string;
};

export type YandexPolygon = {
  events: YandexPlacemarkEvents;
};

export type YandexGeoObject = YandexPlacemark | YandexPolyline | YandexPolygon;

export type YandexGeocoderAddressComponent = {
  kind?: string;
  name?: string;
};

export type YandexGeocoderMetaData = {
  precision?: string;
  text?: string;
  kind?: string;
  Address?: {
    formatted?: string;
    Components?: YandexGeocoderAddressComponent[];
  };
};

export type YandexJsGeocodeGeoObject = {
  geometry: {
    getCoordinates: () => [number, number] | null;
  };
  properties: {
    get: (key: string) => unknown;
  };
  getAddressLine?: () => string;
};

export type YandexJsGeocodeCollection = {
  getLength: () => number;
  get: (index: number) => YandexJsGeocodeGeoObject | null;
};

export type YandexJsGeocodeResult = {
  geoObjects: YandexJsGeocodeCollection;
};

export type YandexSuggestItem = {
  displayName: string;
  value: string;
  type?: string;
  uri?: string;
};

export type YandexSuggestOptions = {
  results?: number;
  boundedBy?: [[number, number], [number, number]];
  provider?: string;
};

export type YandexMapsApi = {
  ready: (callback: () => void) => void;
  suggest?: (
    query: string,
    options?: YandexSuggestOptions,
  ) => Promise<YandexSuggestItem[]>;
  geocode: (
    query: string,
    options?: {
      results?: number;
      boundedBy?: [[number, number], [number, number]];
      strictBounds?: boolean;
    },
  ) => Promise<YandexJsGeocodeResult>;
  Map: new (
    element: HTMLElement | string,
    state: {
      center: [number, number];
      zoom: number;
      controls?: string[];
    },
    options?: {
      suppressMapOpenBlock?: boolean;
    },
  ) => YandexMap;
  Placemark: new (
    coordinates: [number, number],
    properties?: YandexPlacemarkProperties,
    options?: YandexPlacemarkOptions,
  ) => YandexPlacemark;
  Polyline: new (
    coordinates: [number, number][],
    properties?: Record<string, never>,
    options?: YandexPolylineOptions,
  ) => YandexPolyline;
  Polygon: new (
    coordinates: [number, number][][],
    properties?: YandexPolygonProperties,
    options?: YandexPolygonOptions,
  ) => YandexPolygon;
};

declare global {
  interface Window {
    ymaps?: YandexMapsApi;
  }
}

export {};
