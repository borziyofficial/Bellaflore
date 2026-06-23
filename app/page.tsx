"use client";
import { AboutSection } from "@/components/home/AboutSection";
import { ContactQuickActions } from "@/components/contact/ContactQuickActions";
import { CheckoutSection } from "@/components/checkout/CheckoutSection";
import { CollectionsSection } from "@/components/home/CollectionsSection";
import { ContactSection } from "@/components/home/ContactSection";
import { DeliverySection } from "@/components/home/DeliverySection";
import { HeroSection } from "@/components/home/HeroSection";
import { Navbar } from "@/components/home/Navbar";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { MyOrderCard } from "@/components/order/MyOrderCard";
import { MyOrderEmptyState } from "@/components/order/MyOrderEmptyState";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { OrdersSection } from "@/components/order/OrdersSection";
import { MyOrderPanel } from "@/components/orders/MyOrderPanel";
import { CartPanel } from "@/components/panels/CartPanel";
import { FavoritesPanel } from "@/components/panels/FavoritesPanel";
import { SearchPanel } from "@/components/panels/SearchPanel";
import { smartCatalogGroups } from "@/data/smartCatalog";
import {
  type ChangeEvent as ReactChangeEvent,
  type FormEvent as ReactFormEvent,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
  useEffect,
  useRef,
  useState,
} from "react";

const navigationItems = [
  { href: "#home", label: "ГЛАВНАЯ" },
  { href: "#collections", label: "КОЛЛЕКЦИИ" },
  { href: "#delivery", label: "ДОСТАВКА" },
  { href: "#about", label: "О НАС" },
  { href: "#contact", label: "КОНТАКТЫ" },
];

const bouquets = [
  {
    id: "red-luxury",
    src: "/roza rouze royal.PNG",
    alt: "Букет Red Luxury из красных роз",
    title: "Red Luxury",
    description: "51 красная роза",
    searchTerms: [
      "розы",
      "роза",
      "rose",
      "roses",
      "красные розы",
      "букет роз",
      "классика",
      "премиум",
      "сегодня",
      "день рождения",
      "birthday",
    ],
    priceRub: 14900,
    width: 1122,
    height: 1402,
  },
  {
    id: "pink-elegance",
    src: "/0002.jpg",
    alt: "Авторский букет Pink Elegance в розовой гамме",
    title: "Pink Elegance",
    description: "Премиальный авторский букет",
    searchTerms: [
      "авторские букеты",
      "для девушки",
      "девушка",
      "любимая",
      "жене",
      "romantic",
      "нежные букеты",
      "нежный",
      "soft",
      "luxury",
      "премиум",
      "сегодня",
    ],
    priceRub: 11900,
    width: 1086,
    height: 1448,
  },
  {
    id: "white-pearl",
    src: "/white rose 101.PNG",
    alt: "Букет White Pearl из белых роз",
    title: "White Pearl",
    description: "101 белая роза",
    searchTerms: [
      "розы",
      "роза",
      "rose",
      "roses",
      "белые розы",
      "букет роз",
      "премиальные букеты",
      "нежные букеты",
      "soft",
      "luxury",
      "премиум",
      "сегодня",
      "день рождения",
      "birthday",
    ],
    priceRub: 24900,
    width: 1109,
    height: 1418,
  },
  {
    id: "golden-romance",
    src: "/roza rouze royal.PNG",
    alt: "Авторский букет Golden Romance",
    title: "Golden Romance",
    description: "Авторский премиальный букет",
    searchTerms: [
      "авторские букеты",
      "премиальные букеты",
      "для мамы",
      "мама",
      "маме",
      "mother",
      "день рождения",
      "birthday",
      "luxury",
      "премиум",
      "сегодня",
    ],
    priceRub: 15900,
    width: 1136,
    height: 1384,
  },
  {
    id: "luxury-box",
    src: "/mix piony siren.PNG",
    alt: "Композиция Luxury Box с пионами",
    title: "Luxury Box",
    description: "Пионы в премиальной коробке",
    searchTerms: [
      "пионы",
      "пион",
      "peonies",
      "для девушки",
      "девушка",
      "любимая",
      "жене",
      "romantic",
      "премиальные букеты",
      "нежные букеты",
      "soft",
      "luxury",
      "премиум",
      "сегодня",
    ],
    priceRub: 13900,
    width: 1023,
    height: 1537,
  },
  {
    id: "royal-collection",
    src: "/piony 11.PNG",
    alt: "Цветочная композиция Royal Collection",
    title: "Royal Collection",
    description: "Эксклюзивная цветочная композиция",
    searchTerms: [
      "пионы",
      "пион",
      "peonies",
      "гортензии",
      "гортензия",
      "hydrangeas",
      "авторские букеты",
      "для мамы",
      "мама",
      "маме",
      "mother",
      "день рождения",
      "birthday",
      "luxury",
      "премиум",
      "сегодня",
    ],
    priceRub: 18900,
    width: 1254,
    height: 1254,
  },
];

type CartItem = {
  bouquetId: string;
  quantity: number;
};

type PaymentMethod =
  | "cashOnDelivery"
  | "cardTransfer";

type CheckoutForm = {
  name: string;
  phone: string;
  address: string;
  deliveryDate: string;
  deliveryTime: string;
  cardMessage: string;
  comment: string;
};

type ReviewForm = {
  name: string;
  rating: number;
  text: string;
};

type BellafloreReview = ReviewForm & {
  id: string;
  createdAtDisplay: string;
};

type DeliveryZoneId = "zone-1" | "zone-2" | "zone-3" | "zone-4" | "zone-5" | "zone-6";

type DeliveryZone = {
  id: DeliveryZoneId;
  title: string;
  distanceLabel: string;
  priceRub: number;
  estimatedTime: string;
  color: string;
};

type BellafloreOrderItem = {
  bouquetId: string;
  bouquetName: string;
  quantity: number;
  priceRub: number;
  lineTotalRub: number;
};

type BellafloreOrderStatus =
  | "NEW"
  | "CONFIRMED"
  | "PREPARING"
  | "COURIER_ASSIGNED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

type BellaflorePaymentStatus =
  | "PENDING"
  | "PAID"
  | "REFUNDED";

type BellafloreOrder = {
  orderId: string;
  customerName: string;
  customerPhone: string;
  comment: string;
  items: BellafloreOrderItem[];
  totalPriceRub: number;
  paymentMethod: string;
  paymentStatus: BellaflorePaymentStatus;
  paymentProofFileName: string | null;
  deliveryZone?: DeliveryZone;
  deliveryPriceRub?: number;
  deliveryEstimatedTime?: string;
  deliveryAddress?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  checkoutSource?: "bellaflore_checkout";
  telegramNotification?: {
    template: "new_order";
    deliveryZone: DeliveryZone;
    deliveryPriceRub: number;
    deliveryEstimatedTime: string;
  };
  status: BellafloreOrderStatus;
  createdAt: string;
  createdAtDisplay?: string;
};

type BackendOrder = {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  comment: string;
  items: BellafloreOrderItem[];
  total_price: number;
  payment_method: string;
  payment_status: BellaflorePaymentStatus;
  payment_proof_file_name: string | null;
  order_status: BellafloreOrderStatus;
  created_at: string;
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cardTransfer: "Перевод на карту / СБП — рекомендуется",
  cashOnDelivery: "Оплата при получении — по согласованию",
};

const checkoutRequiredFields: {
  field: keyof CheckoutForm;
  message: string;
}[] = [
  { field: "name", message: "Укажите имя заказчика" },
  { field: "phone", message: "Укажите телефон" },
  { field: "address", message: "Укажите адрес доставки" },
  { field: "deliveryDate", message: "Выберите дату доставки" },
  { field: "deliveryTime", message: "Укажите время доставки" },
];

const initialReviews: BellafloreReview[] = [
  {
    id: "review-1",
    name: "Анна",
    rating: 5,
    text: "Букет приехал свежим и очень аккуратным. Перед доставкой прислали фото, все выглядело дорого и нежно.",
    createdAtDisplay: "18 июня 2026",
  },
  {
    id: "review-2",
    name: "Мария",
    rating: 5,
    text: "Заказывала розы в подарок маме. Доставка была вовремя, упаковка красивая, впечатление премиальное.",
    createdAtDisplay: "16 июня 2026",
  },
  {
    id: "review-3",
    name: "Екатерина",
    rating: 4,
    text: "Очень стильный букет и приятная коммуникация. Хочу попробовать авторскую композицию в следующий раз.",
    createdAtDisplay: "14 июня 2026",
  },
];

type DeliveryDatePreset = "today" | "tomorrow" | "custom";

const deliveryIntervals = [
  { label: "09:00–12:00", startMinutes: 9 * 60 },
  { label: "12:00–15:00", startMinutes: 12 * 60 },
  { label: "15:00–18:00", startMinutes: 15 * 60 },
  { label: "18:00–21:00", startMinutes: 18 * 60 },
  { label: "21:00–23:00", startMinutes: 21 * 60 },
];

const deliveryZones: DeliveryZone[] = [
  {
    id: "zone-1",
    title: "Зона 1",
    distanceLabel: "Внутри МКАД",
    priceRub: 0,
    estimatedTime: "60–120 минут",
    color: "#d9ad62",
  },
  {
    id: "zone-2",
    title: "Зона 2",
    distanceLabel: "0–7 км от МКАД",
    priceRub: 700,
    estimatedTime: "90–150 минут",
    color: "#c99b8f",
  },
  {
    id: "zone-3",
    title: "Зона 3",
    distanceLabel: "7–14 км от МКАД",
    priceRub: 1200,
    estimatedTime: "120–180 минут",
    color: "#b98a76",
  },
  {
    id: "zone-4",
    title: "Зона 4",
    distanceLabel: "14–21 км от МКАД",
    priceRub: 1700,
    estimatedTime: "150–210 минут",
    color: "#a98f61",
  },
  {
    id: "zone-5",
    title: "Зона 5",
    distanceLabel: "21–28 км от МКАД",
    priceRub: 2200,
    estimatedTime: "180–240 минут",
    color: "#8f7f6a",
  },
  {
    id: "zone-6",
    title: "Зона 6",
    distanceLabel: "28–35 км от МКАД",
    priceRub: 2700,
    estimatedTime: "210–270 минут",
    color: "#75695c",
  },
];

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addCalendarDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function getAvailableDeliveryIntervals(deliveryDate: string, now: Date) {
  if (!deliveryDate) {
    return [];
  }

  const todayDateValue = formatDateInputValue(now);

  if (deliveryDate !== todayDateValue) {
    return deliveryIntervals;
  }

  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

  return deliveryIntervals.filter(
    (interval) => interval.startMinutes > currentTimeMinutes,
  );
}

function getDeliveryZoneByDistance(distanceFromMkadKm: number) {
  if (distanceFromMkadKm <= 0) {
    return deliveryZones[0];
  }

  const zoneIndex = Math.min(
    Math.ceil(distanceFromMkadKm / 7),
    deliveryZones.length - 1,
  );

  return deliveryZones[zoneIndex];
}

function detectDeliveryZone(address: string) {
  const normalizedAddress = address.toLowerCase().replace(/ё/g, "е");
  const distanceMatch =
    normalizedAddress.match(/(?:мкад|mkad)[^\d]*(\d{1,2})/) ??
    normalizedAddress.match(/(\d{1,2})\s*(?:км|km)[^\n]*(?:мкад|mkad)/);

  if (distanceMatch?.[1]) {
    return getDeliveryZoneByDistance(Number(distanceMatch[1]));
  }

  if (
    normalizedAddress.includes("внутри мкад") ||
    normalizedAddress.includes("москва") ||
    normalizedAddress.includes("цао") ||
    normalizedAddress.includes("сао") ||
    normalizedAddress.includes("свао") ||
    normalizedAddress.includes("вао") ||
    normalizedAddress.includes("ювао") ||
    normalizedAddress.includes("юао") ||
    normalizedAddress.includes("юзао") ||
    normalizedAddress.includes("зао") ||
    normalizedAddress.includes("сзао")
  ) {
    return deliveryZones[0];
  }

  if (!normalizedAddress.trim()) {
    return deliveryZones[0];
  }

  return deliveryZones[1];
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ")
    .trim();
}

const TELEGRAM_USERNAME = "borziy_Sadikhov";
void TELEGRAM_USERNAME;
const LOCAL_ORDERS_STORAGE_KEY = "bellaflore-dev-orders";
const LOCAL_FAVORITES_STORAGE_KEY = "bellaflore-favorite-bouquets";
const LOCAL_CART_STORAGE_KEY = "bellaflore-cart";
const LOCAL_BACKEND_API_BASE_URL = "http://127.0.0.1:8000";
const LAN_BACKEND_API_BASE_URL = "http://192.168.0.141:8000";
const orderStatusLabels: Record<BellafloreOrderStatus, string> = {
  NEW: "Заказ принят",
  CONFIRMED: "Заказ подтверждён",
  PREPARING: "Букет собирается",
  COURIER_ASSIGNED: "Курьер назначен",
  OUT_FOR_DELIVERY: "Курьер в пути",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
};

const customerOrderTimeline: {
  status: BellafloreOrderStatus;
  label: string;
}[] = [
  { status: "NEW", label: "Заказ принят" },
  { status: "PREPARING", label: "Готовится букет" },
  { status: "COURIER_ASSIGNED", label: "Передано курьеру" },
  { status: "OUT_FOR_DELIVERY", label: "В пути" },
  { status: "DELIVERED", label: "Доставлено" },
];

function getCustomerOrderTimelineIndex(status: BellafloreOrderStatus) {
  if (status === "CONFIRMED") {
    return 0;
  }

  const stepIndex = customerOrderTimeline.findIndex(
    (step) => step.status === status,
  );

  return stepIndex >= 0 ? stepIndex : 0;
}

function formatCustomerOrderNumber(orderId: string) {
  return orderId.startsWith("#") ? orderId : `#${orderId}`;
}

function getCustomerOrderNoteLine(order: BellafloreOrder, label: string) {
  const prefix = `${label}:`;
  const line = order.comment
    .split("\n")
    .find((commentLine) => commentLine.startsWith(prefix));

  return line?.slice(prefix.length).trim() ?? "";
}

function isCustomerCreatedOrder(order: BellafloreOrder) {
  return (
    order.checkoutSource === "bellaflore_checkout" &&
    order.items.length > 0 &&
    order.customerName.trim().length > 0 &&
    order.customerPhone.trim().length > 0
  );
}

function readStoredOrders(): BellafloreOrder[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedOrders = window.localStorage.getItem(LOCAL_ORDERS_STORAGE_KEY);
    const parsedOrders = storedOrders ? JSON.parse(storedOrders) : [];

    return Array.isArray(parsedOrders) ? parsedOrders : [];
  } catch {
    return [];
  }
}

function readStoredFavoriteBouquetIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedFavorites = window.localStorage.getItem(
      LOCAL_FAVORITES_STORAGE_KEY,
    );
    const parsedFavorites = storedFavorites ? JSON.parse(storedFavorites) : [];

    if (!Array.isArray(parsedFavorites)) {
      return [];
    }

    const bouquetIds = new Set(bouquets.map((bouquet) => bouquet.id));
    return parsedFavorites.filter(
      (bouquetId): bouquetId is string =>
        typeof bouquetId === "string" && bouquetIds.has(bouquetId),
    );
  } catch {
    return [];
  }
}

function writeStoredFavoriteBouquetIds(favoriteIds: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      LOCAL_FAVORITES_STORAGE_KEY,
      JSON.stringify(favoriteIds),
    );
  } catch {
    // The in-memory favorites state still works if Safari blocks storage.
  }
}

function readStoredCartItems(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedCart = window.localStorage.getItem(LOCAL_CART_STORAGE_KEY);
    const parsedCart = storedCart ? JSON.parse(storedCart) : [];

    if (!Array.isArray(parsedCart)) {
      return [];
    }

    const bouquetIds = new Set(bouquets.map((bouquet) => bouquet.id));
    return parsedCart.flatMap((item): CartItem[] => {
      if (
        !item ||
        typeof item.bouquetId !== "string" ||
        !bouquetIds.has(item.bouquetId) ||
        typeof item.quantity !== "number" ||
        !Number.isFinite(item.quantity) ||
        item.quantity < 1
      ) {
        return [];
      }

      return [
        {
          bouquetId: item.bouquetId,
          quantity: Math.min(Math.floor(item.quantity), 99),
        },
      ];
    });
  } catch {
    return [];
  }
}

function writeStoredCartItems(cartItems: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      LOCAL_CART_STORAGE_KEY,
      JSON.stringify(cartItems),
    );
  } catch {
    // The in-memory cart state still works if Safari blocks storage.
  }
}

function mergeOrdersWithBackendStatuses(
  localOrders: BellafloreOrder[],
  backendOrders: BackendOrder[],
): BellafloreOrder[] {
  const backendOrdersById = new Map(
    backendOrders.map((order) => [order.order_id, order]),
  );

  return localOrders.map((localOrder) => {
    const backendOrder = backendOrdersById.get(localOrder.orderId);

    if (!backendOrder) {
      return localOrder;
    }

    return {
      ...localOrder,
      paymentStatus: backendOrder.payment_status,
      status: backendOrder.order_status,
    };
  });
}

function writeStoredOrders(orders: BellafloreOrder[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      LOCAL_ORDERS_STORAGE_KEY,
      JSON.stringify(orders),
    );
  } catch {
    // localStorage is development-only; React state can still show the orders.
  }
}

function getBackendApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return LOCAL_BACKEND_API_BASE_URL;
  }

  const { hostname } = window.location;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return LOCAL_BACKEND_API_BASE_URL;
  }

  return LAN_BACKEND_API_BASE_URL;
}

function getBackendOrdersUrl(): string {
  return `${getBackendApiBaseUrl()}/orders`;
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactHubOpen, setContactHubOpen] = useState(false);
  const [favoriteBouquetIds, setFavoriteBouquetIds] = useState<string[]>([]);
  const [favoritesRestored, setFavoritesRestored] = useState(false);
  const [favoritesPanelOpen, setFavoritesPanelOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartRestored, setCartRestored] = useState(false);
  const [cartPanelOpen, setCartPanelOpen] = useState(false);
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);
  const [myOrderPanelOpen, setMyOrderPanelOpen] = useState(false);
  const [showCheckoutOnly, setShowCheckoutOnly] = useState(false);
  const [showOrdersOnly, setShowOrdersOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [failedSearchImageIds, setFailedSearchImageIds] = useState<string[]>(
    [],
  );
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>({
    name: "",
    phone: "",
    address: "",
    deliveryDate: "",
    deliveryTime: "",
    cardMessage: "",
    comment: "",
  });
  const [reviews, setReviews] = useState<BellafloreReview[]>(initialReviews);
  const [reviewForm, setReviewForm] = useState<ReviewForm>({
    name: "",
    rating: 5,
    text: "",
  });
  const [reviewFormMessage, setReviewFormMessage] = useState("");
  const [deliveryDateMode, setDeliveryDateMode] =
    useState<DeliveryDatePreset>("today");
  const [checkoutAvailabilityNow, setCheckoutAvailabilityNow] = useState(
    () => new Date(),
  );
  const [checkoutSuccessMessage, setCheckoutSuccessMessage] = useState("");
  const [checkoutValidationErrors, setCheckoutValidationErrors] = useState<
    string[]
  >([]);
  const [confirmedOrders, setConfirmedOrders] =
    useState<BellafloreOrder[]>(readStoredOrders);
  const [latestOrderId, setLatestOrderId] = useState("");
  const [bottomNavAction, setBottomNavAction] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [bottomNavCompact, setBottomNavCompact] = useState(false);
  const lastTouchActionRef = useRef(0);
  const favoritesTouchedRef = useRef(false);
  const checkoutSubmitInProgressRef = useRef(false);

  const syncStoredOrdersWithBackend = async () => {
    const storedOrders = readStoredOrders();

    if (storedOrders.length === 0) {
      setConfirmedOrders([]);
      return;
    }

    try {
      const response = await fetch(getBackendOrdersUrl(), { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`Backend orders request failed: ${response.status}`);
      }

      const backendOrders = (await response.json()) as BackendOrder[];
      const syncedOrders = mergeOrdersWithBackendStatuses(
        storedOrders,
        backendOrders,
      );

      setConfirmedOrders(syncedOrders);
      writeStoredOrders(syncedOrders);
    } catch {
      setConfirmedOrders(storedOrders);
    }
  };

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [menuOpen]);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      if (!favoritesTouchedRef.current) {
        setFavoriteBouquetIds(readStoredFavoriteBouquetIds());
      }
      setFavoritesRestored(true);
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      setCartItems(readStoredCartItems());
      setCartRestored(true);
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (!favoritesRestored) {
      return;
    }

    writeStoredFavoriteBouquetIds(favoriteBouquetIds);
  }, [favoriteBouquetIds, favoritesRestored]);

  useEffect(() => {
    if (!cartRestored) {
      return;
    }

    writeStoredCartItems(cartItems);
  }, [cartItems, cartRestored]);

  useEffect(() => {
    if (
      !favoritesPanelOpen &&
      !cartPanelOpen &&
      !searchPanelOpen &&
      !myOrderPanelOpen
    ) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [cartPanelOpen, favoritesPanelOpen, myOrderPanelOpen, searchPanelOpen]);

  useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      void syncStoredOrdersWithBackend();
    }, 0);

    return () => window.clearTimeout(syncTimer);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let returnTimer = 0;

    const markBottomNavScrolling = () => {
      setBottomNavCompact((isCompact) => (isCompact ? isCompact : true));
      window.clearTimeout(returnTimer);
      returnTimer = window.setTimeout(() => {
        setBottomNavCompact(false);
      }, 400);
    };

    window.addEventListener("scroll", markBottomNavScrolling, { passive: true });
    window.addEventListener("wheel", markBottomNavScrolling, { passive: true });
    document.addEventListener("scroll", markBottomNavScrolling, {
      passive: true,
    });
    document.addEventListener("touchmove", markBottomNavScrolling, {
      passive: true,
    });

    return () => {
      window.clearTimeout(returnTimer);
      window.removeEventListener("scroll", markBottomNavScrolling);
      window.removeEventListener("wheel", markBottomNavScrolling);
      document.removeEventListener("scroll", markBottomNavScrolling);
      document.removeEventListener("touchmove", markBottomNavScrolling);
    };
  }, []);

  useEffect(() => {
    if (!showCheckoutOnly) {
      return;
    }

    requestAnimationFrame(() => {
      document
        .getElementById("checkout")
        ?.scrollIntoView({ block: "start", behavior: "auto" });
    });
  }, [showCheckoutOnly]);

  useEffect(() => {
    if (!showCheckoutOnly) {
      return;
    }

    const availabilityTimer = window.setInterval(() => {
      setCheckoutAvailabilityNow(new Date());
    }, 60 * 1000);

    return () => window.clearInterval(availabilityTimer);
  }, [showCheckoutOnly]);

  useEffect(() => {
    if (!showOrdersOnly) {
      return;
    }

    requestAnimationFrame(() => {
      document
        .getElementById("orders")
        ?.scrollIntoView({ block: "start", behavior: "auto" });
    });
  }, [showOrdersOnly]);

  const closeMenu = () => setMenuOpen(false);
  const closeContactHub = () => setContactHubOpen(false);
  const closeFavoritesPanel = () => setFavoritesPanelOpen(false);
  const closeCartPanel = () => setCartPanelOpen(false);
  const closeSearchPanel = () => setSearchPanelOpen(false);
  const closeMyOrderPanel = () => setMyOrderPanelOpen(false);

  const didHandleRecentTouch = (eventTimeStamp: number) =>
    eventTimeStamp - lastTouchActionRef.current < 450;

  const toggleContactHub = () => {
    setBottomNavAction("");
    setMyOrderPanelOpen(false);
    setContactHubOpen((prev) => !prev);
  };

  const toggleFavoriteBouquet = (bouquetId: string) => {
    favoritesTouchedRef.current = true;

    setFavoriteBouquetIds((currentIds) => {
      const isFavorite = currentIds.includes(bouquetId);
      const nextIds = isFavorite
        ? currentIds.filter((id) => id !== bouquetId)
        : [...currentIds, bouquetId];

      setBottomNavAction(
        isFavorite ? "Букет удалён из избранного" : "Букет добавлен в избранное",
      );

      return nextIds;
    });
  };

  const removeFavoriteBouquet = (bouquetId: string) => {
    favoritesTouchedRef.current = true;
    setFavoriteBouquetIds((currentIds) => {
      const nextIds = currentIds.filter((id) => id !== bouquetId);

      if (nextIds.length === 0) {
        requestAnimationFrame(() => {
          setFavoritesPanelOpen(false);
        });
      }

      return nextIds;
    });
    setBottomNavAction("Букет удалён из избранного");
  };

  const handleFavoriteClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => {
    if (
      lastTouchActionRef.current > 0 &&
      didHandleRecentTouch(event.timeStamp)
    ) {
      return;
    }

    toggleFavoriteBouquet(bouquetId);
  };

  const handleFavoriteTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => {
    event.preventDefault();
    lastTouchActionRef.current = event.timeStamp;
    toggleFavoriteBouquet(bouquetId);
  };

  const handleFavoriteRemoveClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => {
    event.preventDefault();

    if (
      lastTouchActionRef.current > 0 &&
      didHandleRecentTouch(event.timeStamp)
    ) {
      return;
    }

    removeFavoriteBouquet(bouquetId);
  };

  const handleFavoriteRemoveTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => {
    event.preventDefault();
    lastTouchActionRef.current = event.timeStamp;
    removeFavoriteBouquet(bouquetId);
  };

  const favoriteBouquets = bouquets.filter((bouquet) =>
    favoriteBouquetIds.includes(bouquet.id),
  );
  const reviewsCount = reviews.length;
  const averageReviewRating =
    reviewsCount > 0
      ? reviews.reduce((total, review) => total + review.rating, 0) /
        reviewsCount
      : 0;
  const averageReviewRatingLabel =
    reviewsCount > 0 ? averageReviewRating.toFixed(1) : "0.0";

  const cartBouquets = cartItems.flatMap((cartItem) => {
    const bouquet = bouquets.find((item) => item.id === cartItem.bouquetId);

    return bouquet ? [{ ...cartItem, bouquet }] : [];
  });
  const customerOrders = confirmedOrders.filter(isCustomerCreatedOrder);

  const cartItemCount = cartItems.reduce(
    (total, cartItem) => total + cartItem.quantity,
    0,
  );

  const checkoutTotalPrice = cartBouquets.reduce(
    (total, cartItem) => total + cartItem.bouquet.priceRub * cartItem.quantity,
    0,
  );
  const selectedDeliveryZone = detectDeliveryZone(checkoutForm.address);
  const checkoutGrandTotalPrice =
    checkoutTotalPrice + selectedDeliveryZone.priceRub;

  const formatPrice = (priceRub: number) =>
    `${priceRub.toLocaleString("ru-RU")} ₽`;
  const renderRatingStars = (rating: number) =>
    Array.from({ length: 5 }, (_, index) =>
      index < rating ? "★" : "☆",
    ).join("");
  const latestOrder =
    customerOrders.find((order) => order.orderId === latestOrderId) ??
    customerOrders[customerOrders.length - 1];

  const checkoutNow = checkoutAvailabilityNow;
  const todayDateValue = formatDateInputValue(checkoutNow);
  const tomorrowDateValue = formatDateInputValue(
    addCalendarDays(checkoutNow, 1),
  );
  const todayAvailableDeliveryIntervals = getAvailableDeliveryIntervals(
    todayDateValue,
    checkoutNow,
  );
  const availableDeliveryIntervals = getAvailableDeliveryIntervals(
    checkoutForm.deliveryDate,
    checkoutNow,
  );

  const normalizedSearchQuery = normalizeSearchText(searchQuery);
  const searchResults = normalizedSearchQuery
    ? bouquets.filter((bouquet) =>
        normalizeSearchText(bouquet.title).includes(normalizedSearchQuery),
      )
    : bouquets;

  const addBouquetToCart = (bouquetId: string) => {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.bouquetId === bouquetId,
      );

      setBottomNavAction("Букет добавлен в корзину");

      if (!existingItem) {
        return [...currentItems, { bouquetId, quantity: 1 }];
      }

      return currentItems.map((item) =>
        item.bouquetId === bouquetId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      );
    });
  };

  const removeBouquetFromCart = (bouquetId: string) => {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.bouquetId !== bouquetId),
    );
  };

  const decreaseCartItemQuantity = (bouquetId: string) => {
    setCartItems((currentItems) =>
      currentItems.flatMap((item) => {
        if (item.bouquetId !== bouquetId) {
          return [item];
        }

        if (item.quantity <= 1) {
          return [];
        }

        return [{ ...item, quantity: item.quantity - 1 }];
      }),
    );
    setBottomNavAction("Количество обновлено");
  };

  const increaseCartItemQuantity = (bouquetId: string) => {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.bouquetId === bouquetId
          ? { ...item, quantity: Math.min(item.quantity + 1, 99) }
          : item,
      ),
    );
    setBottomNavAction("Количество обновлено");
  };

  const handleCartAddClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => {
    event.preventDefault();

    if (didHandleRecentTouch(event.timeStamp)) {
      return;
    }

    addBouquetToCart(bouquetId);
  };

  const handleCartAddTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => {
    event.preventDefault();
    lastTouchActionRef.current = event.timeStamp;
    addBouquetToCart(bouquetId);
  };

  void handleCartAddClick;
  void handleCartAddTouchEnd;

  const handleCartRemoveClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => {
    event.preventDefault();

    if (didHandleRecentTouch(event.timeStamp)) {
      return;
    }

    removeBouquetFromCart(bouquetId);
    setBottomNavAction("Букет удалён из корзины");
  };

  const handleCartRemoveTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => {
    event.preventDefault();
    lastTouchActionRef.current = event.timeStamp;
    removeBouquetFromCart(bouquetId);
    setBottomNavAction("Букет удалён из корзины");
  };

  const handleCartDecreaseClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => {
    event.preventDefault();

    if (didHandleRecentTouch(event.timeStamp)) {
      return;
    }

    decreaseCartItemQuantity(bouquetId);
  };

  const handleCartDecreaseTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => {
    event.preventDefault();
    lastTouchActionRef.current = event.timeStamp;
    decreaseCartItemQuantity(bouquetId);
  };

  const handleCartIncreaseClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => {
    event.preventDefault();

    if (didHandleRecentTouch(event.timeStamp)) {
      return;
    }

    increaseCartItemQuantity(bouquetId);
  };

  const handleCartIncreaseTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => {
    event.preventDefault();
    lastTouchActionRef.current = event.timeStamp;
    increaseCartItemQuantity(bouquetId);
  };

  const openFavoritesPanel = () => {
    setContactHubOpen(false);
    setCartPanelOpen(false);
    setSearchPanelOpen(false);
    setMyOrderPanelOpen(false);
    setFavoritesPanelOpen(true);
    setBottomNavAction(
      favoriteBouquetIds.length > 0
        ? "Открыто избранное"
        : "Избранное пока пусто",
    );
  };

  const handleFavoritesNavClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (
      lastTouchActionRef.current > 0 &&
      didHandleRecentTouch(event.timeStamp)
    ) {
      return;
    }

    openFavoritesPanel();
  };

  const handleFavoritesNavTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    lastTouchActionRef.current = event.timeStamp;
    openFavoritesPanel();
  };

  const openCartPanel = () => {
    setContactHubOpen(false);
    setFavoritesPanelOpen(false);
    setSearchPanelOpen(false);
    setMyOrderPanelOpen(false);
    setCartPanelOpen(true);
    setBottomNavAction(
      cartItemCount > 0 ? "Открыта корзина" : "Ваша корзина пока пуста",
    );
  };

  const handleCartNavClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (didHandleRecentTouch(event.timeStamp)) {
      return;
    }

    openCartPanel();
  };

  const handleCartNavTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    lastTouchActionRef.current = event.timeStamp;
    openCartPanel();
  };

  // Cart nav is intentionally dormant while Мой заказ occupies the mobile slot.
  void handleCartNavClick;
  void handleCartNavTouchEnd;

  const openSearchPanel = () => {
    setContactHubOpen(false);
    setFavoritesPanelOpen(false);
    setCartPanelOpen(false);
    setMyOrderPanelOpen(false);
    setSearchPanelOpen(true);
    setBottomNavAction("Открыт поиск букетов");
  };

  const handleSearchNavClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (didHandleRecentTouch(event.timeStamp)) {
      return;
    }

    openSearchPanel();
  };

  const handleSearchNavTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    lastTouchActionRef.current = event.timeStamp;
    openSearchPanel();
  };

  const initializeCheckoutDeliveryDate = () => {
    setCheckoutAvailabilityNow(new Date());
    const nextDeliveryDate = checkoutForm.deliveryDate || todayDateValue;
    setDeliveryDateMode(
      nextDeliveryDate === todayDateValue
        ? "today"
        : nextDeliveryDate === tomorrowDateValue
          ? "tomorrow"
          : "custom",
    );
    setCheckoutForm((currentForm) => ({
      ...currentForm,
      deliveryDate: currentForm.deliveryDate || todayDateValue,
      deliveryTime:
        currentForm.deliveryDate === todayDateValue &&
        !todayAvailableDeliveryIntervals.some(
          (interval) => interval.label === currentForm.deliveryTime,
        )
          ? ""
          : currentForm.deliveryTime,
    }));
  };

  const prepareFavoriteCheckout = (bouquetId: string) => {
    setCartItems([{ bouquetId, quantity: 1 }]);
    initializeCheckoutDeliveryDate();
    setContactHubOpen(false);
    setFavoritesPanelOpen(false);
    setCartPanelOpen(false);
    setSearchPanelOpen(false);
    setMyOrderPanelOpen(false);
    setShowCheckoutOnly(true);
    setShowOrdersOnly(false);
    setBottomNavAction("Букет подготовлен к покупке");
    window.setTimeout(scrollToCheckout, 0);
  };

  const handleFavoriteBuyClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => {
    event.preventDefault();

    if (didHandleRecentTouch(event.timeStamp)) {
      return;
    }

    prepareFavoriteCheckout(bouquetId);
  };

  const handleFavoriteBuyTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => {
    event.preventDefault();
    lastTouchActionRef.current = event.timeStamp;
    prepareFavoriteCheckout(bouquetId);
  };

  const handleSearchBuyClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => {
    event.preventDefault();

    if (didHandleRecentTouch(event.timeStamp)) {
      return;
    }

    prepareFavoriteCheckout(bouquetId);
  };

  const handleSearchBuyTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => {
    event.preventDefault();
    lastTouchActionRef.current = event.timeStamp;
    prepareFavoriteCheckout(bouquetId);
  };

  const handleBouquetOrderClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => {
    event.preventDefault();

    if (didHandleRecentTouch(event.timeStamp)) {
      return;
    }

    prepareFavoriteCheckout(bouquetId);
  };

  const handleBouquetOrderTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
  ) => {
    event.preventDefault();
    lastTouchActionRef.current = event.timeStamp;
    prepareFavoriteCheckout(bouquetId);
  };

  const openMyOrderPanel = () => {
    setContactHubOpen(false);
    setFavoritesPanelOpen(false);
    setCartPanelOpen(false);
    setSearchPanelOpen(false);
    const storedOrders = readStoredOrders();
    const storedCustomerOrders = storedOrders.filter(isCustomerCreatedOrder);
    setConfirmedOrders((currentOrders) =>
      storedOrders.length > 0 ? storedOrders : currentOrders,
    );
    setLatestOrderId((currentOrderId) =>
      currentOrderId ||
      storedCustomerOrders[storedCustomerOrders.length - 1]?.orderId ||
      "",
    );
    setMyOrderPanelOpen(true);
    setBottomNavAction(
      storedCustomerOrders.length > 0
        ? "Показан мой заказ"
        : "У вас пока нет заказов",
    );
  };

  const handleMyOrderNavClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (didHandleRecentTouch(event.timeStamp)) {
      return;
    }

    openMyOrderPanel();
  };

  const handleMyOrderNavTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    lastTouchActionRef.current = event.timeStamp;
    openMyOrderPanel();
  };

  const handleSearchQueryChange = (
    event: ReactChangeEvent<HTMLInputElement>,
  ) => {
    setSearchQuery(event.target.value);
  };

  const clearSearchQuery = () => {
    setSearchQuery("");
    setBottomNavAction("Поиск очищен");
  };

  const markSearchImageFailed = (bouquetId: string) => {
    setFailedSearchImageIds((currentIds) =>
      currentIds.includes(bouquetId) ? currentIds : [...currentIds, bouquetId],
    );
  };

  const applySearchSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    setBottomNavAction(`Поиск: ${suggestion}`);
  };

  const handleSearchSuggestionClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
    suggestion: string,
  ) => {
    event.preventDefault();

    if (didHandleRecentTouch(event.timeStamp)) {
      return;
    }

    applySearchSuggestion(suggestion);
  };

  const handleSearchSuggestionTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
    suggestion: string,
  ) => {
    event.preventDefault();
    lastTouchActionRef.current = event.timeStamp;
    applySearchSuggestion(suggestion);
  };

  const scrollToCheckout = () => {
    requestAnimationFrame(() => {
      document
        .getElementById("checkout")
        ?.scrollIntoView({ block: "start", behavior: "auto" });
    });
  };

  const openCheckoutView = () => {
    if (cartItemCount === 0) {
      setShowCheckoutOnly(false);
      setBottomNavAction("Корзина пока пуста");
      return;
    }

    setContactHubOpen(false);
    setFavoritesPanelOpen(false);
    setCartPanelOpen(false);
    setSearchPanelOpen(false);
    setMyOrderPanelOpen(false);
    initializeCheckoutDeliveryDate();
    setShowCheckoutOnly(true);
    setShowOrdersOnly(false);
    setBottomNavAction("Оформление заказа");
    scrollToCheckout();
  };

  const scrollToOrders = () => {
    requestAnimationFrame(() => {
      document
        .getElementById("orders")
        ?.scrollIntoView({ block: "start", behavior: "auto" });
    });
  };

  const openOrdersView = () => {
    setContactHubOpen(false);
    setFavoritesPanelOpen(false);
    setCartPanelOpen(false);
    setSearchPanelOpen(false);
    setMyOrderPanelOpen(false);
    setShowCheckoutOnly(false);
    setShowOrdersOnly(true);
    const storedOrders = readStoredOrders();
    setConfirmedOrders((currentOrders) =>
      storedOrders.length > 0 ? storedOrders : currentOrders,
    );
    void syncStoredOrdersWithBackend();
    setBottomNavAction("Показаны заказы");
    scrollToOrders();
  };

  const handleOrdersClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();

    if (didHandleRecentTouch(event.timeStamp)) {
      return;
    }

    openOrdersView();
  };

  const handleOrdersTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    lastTouchActionRef.current = event.timeStamp;
    openOrdersView();
  };

  const handleCheckoutClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();

    if (didHandleRecentTouch(event.timeStamp)) {
      return;
    }

    openCheckoutView();
  };

  const handleCheckoutTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    lastTouchActionRef.current = event.timeStamp;
    openCheckoutView();
  };

  const handleCheckoutFieldChange = (
    field: keyof CheckoutForm,
    value: CheckoutForm[keyof CheckoutForm],
  ) => {
    setCheckoutForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
    setCheckoutSuccessMessage("");
    setCheckoutValidationErrors([]);
  };

  const handleReviewFieldChange = (
    field: keyof ReviewForm,
    value: ReviewForm[keyof ReviewForm],
  ) => {
    setReviewForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
    setReviewFormMessage("");
  };

  const handleReviewSubmit = (event: ReactFormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = reviewForm.name.trim();
    const text = reviewForm.text.trim();

    if (!name || !text) {
      setReviewFormMessage("Заполните имя и текст отзыва");
      return;
    }

    const createdAt = new Date();
    const nextReview: BellafloreReview = {
      id: `review-local-${createdAt.getTime()}`,
      name,
      rating: reviewForm.rating,
      text,
      createdAtDisplay: createdAt.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    };

    setReviews((currentReviews) => [nextReview, ...currentReviews]);
    setReviewForm({
      name: "",
      rating: 5,
      text: "",
    });
    setReviewFormMessage("Спасибо, отзыв добавлен");
  };

  const selectDeliveryDatePreset = (preset: DeliveryDatePreset) => {
    setDeliveryDateMode(preset);
    setCheckoutForm((currentForm) => {
      const nextDeliveryDate =
        preset === "today"
          ? todayDateValue
          : preset === "tomorrow"
            ? tomorrowDateValue
            : "";

      const nextDeliveryTime =
        preset === "today" &&
        !todayAvailableDeliveryIntervals.some(
          (interval) => interval.label === currentForm.deliveryTime,
        )
          ? ""
          : currentForm.deliveryTime;

      return {
        ...currentForm,
        deliveryDate: nextDeliveryDate,
        deliveryTime: preset === "custom" ? "" : nextDeliveryTime,
      };
    });
    setCheckoutSuccessMessage("");
    setCheckoutValidationErrors([]);
  };

  const handleCustomDeliveryDateChange = (value: string) => {
    setDeliveryDateMode("custom");
    setCheckoutForm((currentForm) => ({
      ...currentForm,
      deliveryDate: value,
      deliveryTime:
        value === todayDateValue &&
        !todayAvailableDeliveryIntervals.some(
          (interval) => interval.label === currentForm.deliveryTime,
        )
          ? ""
          : currentForm.deliveryTime,
    }));
    setCheckoutSuccessMessage("");
    setCheckoutValidationErrors([]);
  };

  const confirmCheckoutOrder = async () => {
    if (checkoutSubmitInProgressRef.current) {
      return;
    }

    const customerName = checkoutForm.name.trim();
    const customerPhone = checkoutForm.phone.trim();
    const validationErrors = checkoutRequiredFields
      .filter(({ field }) => !checkoutForm[field].trim())
      .map(({ message }) => message);

    if (validationErrors.length > 0) {
      setCheckoutValidationErrors(validationErrors);
      setBottomNavAction("Заполните обязательные поля");
      setCheckoutSuccessMessage("");
      return;
    }

    const currentAvailableDeliveryIntervals = getAvailableDeliveryIntervals(
      checkoutForm.deliveryDate.trim(),
      new Date(),
    );
    const deliveryTimeAvailable = currentAvailableDeliveryIntervals.some(
      (interval) => interval.label === checkoutForm.deliveryTime.trim(),
    );

    if (!deliveryTimeAvailable) {
      setCheckoutForm((currentForm) => ({
        ...currentForm,
        deliveryTime: "",
      }));
      setCheckoutValidationErrors([
        "Выберите доступный интервал доставки",
      ]);
      setBottomNavAction("Выберите доступный интервал");
      setCheckoutSuccessMessage("");
      return;
    }

    if (cartItemCount === 0) {
      setShowCheckoutOnly(false);
      setBottomNavAction("Корзина пока пуста");
      setCheckoutSuccessMessage("");
      return;
    }

    checkoutSubmitInProgressRef.current = true;
    try {
      const storedOrders = readStoredOrders();
      const orderId = `BF-${1001 + storedOrders.length}`;
      const createdAt = new Date();
      const paymentMethod = paymentMethodLabels.cardTransfer;
      const paymentStatus = "PENDING";
      const deliveryComment = [
        `Адрес доставки: ${checkoutForm.address.trim()}`,
        `Зона доставки: ${selectedDeliveryZone.title} — ${selectedDeliveryZone.distanceLabel}`,
        `Стоимость доставки: ${formatPrice(selectedDeliveryZone.priceRub)}`,
        `Ожидаемое время доставки: ${selectedDeliveryZone.estimatedTime}`,
        `Дата доставки: ${checkoutForm.deliveryDate.trim()}`,
        `Время доставки: ${checkoutForm.deliveryTime.trim()}`,
        checkoutForm.cardMessage.trim()
          ? `Открытка: ${checkoutForm.cardMessage.trim()}`
          : "",
        checkoutForm.comment.trim()
          ? `Комментарий: ${checkoutForm.comment.trim()}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
      const order: BellafloreOrder = {
        orderId,
        customerName,
        customerPhone,
        comment: deliveryComment,
        items: cartBouquets.map((cartItem) => ({
          bouquetId: cartItem.bouquet.id,
          bouquetName: cartItem.bouquet.title,
          quantity: cartItem.quantity,
          priceRub: cartItem.bouquet.priceRub,
          lineTotalRub: cartItem.bouquet.priceRub * cartItem.quantity,
        })),
        totalPriceRub: checkoutGrandTotalPrice,
        paymentMethod,
        paymentStatus,
        paymentProofFileName: null,
        deliveryZone: selectedDeliveryZone,
        deliveryPriceRub: selectedDeliveryZone.priceRub,
        deliveryEstimatedTime: selectedDeliveryZone.estimatedTime,
        deliveryAddress: checkoutForm.address.trim(),
        deliveryDate: checkoutForm.deliveryDate.trim(),
        deliveryTime: checkoutForm.deliveryTime.trim(),
        checkoutSource: "bellaflore_checkout",
        telegramNotification: {
          template: "new_order",
          deliveryZone: selectedDeliveryZone,
          deliveryPriceRub: selectedDeliveryZone.priceRub,
          deliveryEstimatedTime: selectedDeliveryZone.estimatedTime,
        },
        status: "NEW",
        createdAt: createdAt.toISOString(),
        createdAtDisplay: createdAt.toLocaleString("ru-RU"),
      };
      const nextOrders = [...storedOrders, order];

      setConfirmedOrders(nextOrders);
      try {
        window.localStorage.setItem(
          LOCAL_ORDERS_STORAGE_KEY,
          JSON.stringify(nextOrders),
        );
      } catch {
        // localStorage is development-only; local React state already has the order.
      }
      setLatestOrderId(orderId);
      setCheckoutSuccessMessage("");
      setCartItems([]);
      setCheckoutForm({
        name: "",
        phone: "",
        address: "",
        deliveryDate: "",
        deliveryTime: "",
        cardMessage: "",
        comment: "",
      });
      setDeliveryDateMode("today");
      setCheckoutValidationErrors([]);
      setShowCheckoutOnly(false);
      setShowOrdersOnly(true);
      setBottomNavAction("Заказ принят");
      scrollToOrders();
    } finally {
      checkoutSubmitInProgressRef.current = false;
    }
  };

  const handleConfirmOrderClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();

    if (didHandleRecentTouch(event.timeStamp)) {
      return;
    }

    void confirmCheckoutOrder();
  };

  const handleConfirmOrderTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    lastTouchActionRef.current = event.timeStamp;

    void confirmCheckoutOrder();
  };

  const renderMyOrderEmptyState = () => (
    <MyOrderEmptyState onCloseMyOrderPanel={closeMyOrderPanel} />
  );

  const renderMyOrderCard = (order: BellafloreOrder) => {
    const primaryOrderItem = order.items[0];
    const activeTimelineIndex = Math.min(
      getCustomerOrderTimelineIndex(order.status),
      0,
    );
    const cardMessage = getCustomerOrderNoteLine(order, "Открытка");
    const customerComment = getCustomerOrderNoteLine(order, "Комментарий");

    return (
      <MyOrderCard
        orderId={order.orderId}
        statusLabel={orderStatusLabels[order.status]}
        customerName={order.customerName}
        customerPhone={order.customerPhone}
        deliveryAddress={order.deliveryAddress}
        deliveryDate={order.deliveryDate}
        deliveryTime={order.deliveryTime}
        cardMessage={cardMessage}
        customerComment={customerComment}
        primaryOrderItem={primaryOrderItem}
        activeTimelineIndex={activeTimelineIndex}
        customerOrderTimeline={customerOrderTimeline}
        formatCustomerOrderNumber={formatCustomerOrderNumber}
        formatPrice={formatPrice}
      />
    );
  };

  return (
    <>
      <Navbar
        navigationItems={navigationItems}
        scrolled={scrolled}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((prev) => !prev)}
        onCloseMenu={closeMenu}
      />

      <HeroSection />

      <CollectionsSection
        bouquets={bouquets}
        favoriteBouquetIds={favoriteBouquetIds}
        formatPrice={formatPrice}
        handleFavoriteClick={handleFavoriteClick}
        handleFavoriteTouchEnd={handleFavoriteTouchEnd}
        handleBouquetOrderClick={handleBouquetOrderClick}
        handleBouquetOrderTouchEnd={handleBouquetOrderTouchEnd}
      />

      {favoritesPanelOpen && (
        <FavoritesPanel
          favoriteBouquetIds={favoriteBouquetIds}
          favoriteBouquets={favoriteBouquets}
          formatPrice={formatPrice}
          onCloseFavoritesPanel={closeFavoritesPanel}
          handleFavoriteRemoveClick={handleFavoriteRemoveClick}
          handleFavoriteRemoveTouchEnd={handleFavoriteRemoveTouchEnd}
          handleFavoriteBuyClick={handleFavoriteBuyClick}
          handleFavoriteBuyTouchEnd={handleFavoriteBuyTouchEnd}
        />
      )}

      {cartPanelOpen && (
        <CartPanel
          cartBouquets={cartBouquets}
          cartItemCount={cartItemCount}
          checkoutTotalPrice={checkoutTotalPrice}
          formatPrice={formatPrice}
          closeCartPanel={closeCartPanel}
          handleCartDecreaseClick={handleCartDecreaseClick}
          handleCartDecreaseTouchEnd={handleCartDecreaseTouchEnd}
          handleCartIncreaseClick={handleCartIncreaseClick}
          handleCartIncreaseTouchEnd={handleCartIncreaseTouchEnd}
          handleCartRemoveClick={handleCartRemoveClick}
          handleCartRemoveTouchEnd={handleCartRemoveTouchEnd}
          handleCheckoutClick={handleCheckoutClick}
          handleCheckoutTouchEnd={handleCheckoutTouchEnd}
        />
      )}

      {myOrderPanelOpen && (
        <MyOrderPanel closeMyOrderPanel={closeMyOrderPanel}>
          {latestOrder
            ? renderMyOrderCard(latestOrder)
            : renderMyOrderEmptyState()}
        </MyOrderPanel>
      )}

      {showCheckoutOnly && (
        <CheckoutSection
          checkoutForm={checkoutForm}
          deliveryZones={deliveryZones}
          selectedDeliveryZone={selectedDeliveryZone}
          deliveryDateMode={deliveryDateMode}
          todayDateValue={todayDateValue}
          availableDeliveryIntervals={availableDeliveryIntervals}
          cartBouquets={cartBouquets}
          checkoutTotalPrice={checkoutTotalPrice}
          checkoutGrandTotalPrice={checkoutGrandTotalPrice}
          checkoutValidationErrors={checkoutValidationErrors}
          checkoutSuccessMessage={checkoutSuccessMessage}
          cartItemCount={cartItemCount}
          formatPrice={formatPrice}
          handleCheckoutFieldChange={handleCheckoutFieldChange}
          selectDeliveryDatePreset={selectDeliveryDatePreset}
          handleCustomDeliveryDateChange={handleCustomDeliveryDateChange}
          handleOrdersClick={handleOrdersClick}
          handleOrdersTouchEnd={handleOrdersTouchEnd}
          handleConfirmOrderClick={handleConfirmOrderClick}
          handleConfirmOrderTouchEnd={handleConfirmOrderTouchEnd}
        />
      )}

      {showOrdersOnly && (
        <OrdersSection>
          {latestOrder
            ? renderMyOrderCard(latestOrder)
            : renderMyOrderEmptyState()}
        </OrdersSection>
      )}

      {searchPanelOpen && (
        <SearchPanel
          searchQuery={searchQuery}
          smartCatalogGroups={smartCatalogGroups}
          normalizedSearchQuery={normalizedSearchQuery}
          searchResults={searchResults}
          favoriteBouquetIds={favoriteBouquetIds}
          failedSearchImageIds={failedSearchImageIds}
          formatPrice={formatPrice}
          closeSearchPanel={closeSearchPanel}
          handleSearchQueryChange={handleSearchQueryChange}
          clearSearchQuery={clearSearchQuery}
          handleSearchSuggestionClick={handleSearchSuggestionClick}
          handleSearchSuggestionTouchEnd={handleSearchSuggestionTouchEnd}
          markSearchImageFailed={markSearchImageFailed}
          handleFavoriteClick={handleFavoriteClick}
          handleFavoriteTouchEnd={handleFavoriteTouchEnd}
          handleSearchBuyClick={handleSearchBuyClick}
          handleSearchBuyTouchEnd={handleSearchBuyTouchEnd}
        />
      )}

      <DeliverySection />

      <AboutSection />

      <ReviewsSection
        averageReviewRating={averageReviewRating}
        averageReviewRatingLabel={averageReviewRatingLabel}
        reviewsCount={reviewsCount}
        reviewForm={reviewForm}
        reviewFormMessage={reviewFormMessage}
        reviews={reviews}
        renderRatingStars={renderRatingStars}
        handleReviewSubmit={handleReviewSubmit}
        handleReviewFieldChange={handleReviewFieldChange}
      />

      <ContactSection />

      <MobileBottomNav
        bottomNavCompact={bottomNavCompact}
        bottomNavAction={bottomNavAction}
        searchPanelOpen={searchPanelOpen}
        contactHubOpen={contactHubOpen}
        favoritesPanelOpen={favoritesPanelOpen}
        myOrderPanelOpen={myOrderPanelOpen}
        favoriteBouquetIds={favoriteBouquetIds}
        handleSearchNavClick={handleSearchNavClick}
        handleSearchNavTouchEnd={handleSearchNavTouchEnd}
        toggleContactHub={toggleContactHub}
        handleFavoritesNavClick={handleFavoritesNavClick}
        handleFavoritesNavTouchEnd={handleFavoritesNavTouchEnd}
        handleMyOrderNavClick={handleMyOrderNavClick}
        handleMyOrderNavTouchEnd={handleMyOrderNavTouchEnd}
      />

      {contactHubOpen && (
        <ContactQuickActions closeContactHub={closeContactHub} />
      )}
    </>
  );
}
