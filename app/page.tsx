"use client";

// ==================================================
// SECTION: Storefront Home Page
// РАЗДЕЛ: Главная страница витрины
//
// Purpose (EN): Client-side storefront shell — catalog, cart, checkout, orders, favorites, reviews, and mobile bottom nav.
//
// Назначение (RU): Клиентская оболочка витрины — каталог, корзина, checkout, заказы, избранное, отзывы и mobile bottom nav.
// ==================================================

import { CheckoutSection } from "@/components/checkout/CheckoutSection";
import { CheckoutPanel } from "@/components/checkout/CheckoutPanel";
import { useRealDeliveryZoneForCheckout } from "@/components/deliveryZones/useRealDeliveryZoneForCheckout";
import {
  canSubmitCheckoutWithDeliveryPrice,
  resolveDeliveryPriceFromZone,
} from "@/components/deliveryZones/deliveryPriceEngine";
import {
  calculateCheckoutGrandTotalWithConfidence,
  resolveDeliveryConfidence,
} from "@/components/deliveryConfidence/deliveryConfidenceEngine";
import { getDeliveryPriceUnavailableMessage } from "@/components/deliveryZones/deliveryPriceTypes";
import {
  canSubmitCheckoutWithDeliveryValidation,
  getDeliveryValidationUnavailableMessage,
  resolveDeliveryValidationForCheckout,
} from "@/components/deliveryValidation/deliveryValidationEngine";
import { getAvailableDeliveryIntervals } from "@/components/checkout/deliveryIntervals";
import { buildCheckoutOrderPayload } from "@/components/checkout/buildCheckoutOrderPayload";
import { bootstrapCrmFromLogisticsAndLifecycle } from "@/components/crmCore/crmCoreEngine";
import { persistOrderIntelligenceFromCheckout } from "@/components/orderIntelligence/checkoutOrderBridge";
import { createAndSaveLogisticsOrderFromCheckout } from "@/components/deliveryOrchestration/deliveryOrchestrationEngine";
import {
  createAndSaveOrderLifecycleFromLogisticsOrder,
  createOrderLifecycle,
} from "@/components/orderLifecycle/orderLifecycleEngine";
import {
  buildCheckoutStoredOrder,
  CHECKOUT_ORDER_CREATED_STATUS,
  readCheckoutOrders,
  readLatestCheckoutOrderId,
  writeCheckoutOrders,
  writeLatestCheckoutOrderId,
} from "@/components/checkout/checkoutOrderStorage";
import type { OrderTimelineEvent } from "@/components/orders/orderTimeline";
import { getCustomerOrderStatusLabel } from "@/components/orders/resolveCustomerOrderTimeline";
import {
  type CheckoutForm,
  type CheckoutOrderPayload,
  type DeliveryDatePreset,
} from "@/components/checkout/checkoutTypes";
import { submitCheckoutOrderToTelegram } from "@/components/telegram/submitCheckoutOrderToTelegram";
import { AboutSection } from "@/components/home/AboutSection";
import { CollectionsSection } from "@/components/home/CollectionsSection";
import { ContactSection } from "@/components/home/ContactSection";
import { DeliverySection } from "@/components/home/DeliverySection";
import { HeroSection } from "@/components/home/HeroSection";
import { Navbar } from "@/components/home/Navbar";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import {
  BOTTOM_NAV_PANEL_CLOSE_MS,
  getBottomNavPanelClosedMessage,
  getBottomNavPanelOpenMessage,
  type BottomNavPanelId,
} from "@/components/navigation/bottomNavPanels";
import { OrdersSection } from "@/components/order/OrdersSection";
import { MyOrderHub } from "@/components/orders/MyOrderHub";
import type { OrderPassportData } from "@/components/orders/MyOrderPassport";
import type { ProfileHubSectionId } from "@/components/orders/profileHubTypes";
import { MyOrderPanel } from "@/components/orders/MyOrderPanel";
import { getOrdersUrl } from "@/app/orders/orderUtils";
import { FavoritesPanel } from "@/components/panels/FavoritesPanel";
import { BottomNavPanelFrame } from "@/components/panels/BottomNavPanelFrame";
import { findPublicStorefrontProduct } from "@/components/catalog/publicCatalogMerge";
import { usePublicStorefrontCatalog } from "@/components/catalog/usePublicStorefrontCatalog";
import { ProductExperiencePage } from "@/components/product/ProductExperiencePage";
import type { ProductSizeId } from "@/components/product/productExperienceTypes";
import {
  getProductExperienceData,
  getProductSizeVariant,
} from "@/components/product/productExperienceCatalog";
import type { CatalogProduct } from "@/data/catalogProducts";
import {
  type FormEvent as ReactFormEvent,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const navigationItems = [
  { href: "#home", label: "Главная" },
  { href: "#catalog", label: "Каталог" },
  { href: "#delivery", label: "Доставка" },
  { href: "#reviews", label: "Отзывы" },
  { href: "#about", label: "О Bellaflore" },
  { href: "#contact", label: "Связь" },
];

const SCROLL_SECTION_IDS = [
  "delivery",
  "reviews",
  "about",
  "contact",
] as const;

type PublicAppView = "home" | "catalog";

type CartItem = {
  bouquetId: string;
  quantity: number;
  sizeId: ProductSizeId;
  priceRub: number;
};

type PaymentMethod =
  | "cashOnDelivery"
  | "cardTransfer";

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
  deliveryZoneId?: string;
  deliveryZoneLabel?: string;
  deliveryZonePriceRub?: number;
  deliveryZoneDistanceKm?: number;
  deliveryZoneRoadDistanceKm?: number;
  deliveryZoneRoadDurationMinutes?: number;
  deliveryZoneStatus?: string;
  deliveryZoneDetectionMode?: string;
  customerComment?: string;
  cardMessage?: string;
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
  timeline?: OrderTimelineEvent[];
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

const initialReviews: BellafloreReview[] = [
  {
    id: "demo-review-1",
    name: "Антон",
    rating: 5,
    text: "Заказал букет на годовщину — всё аккуратно, свежо и с отличной упаковкой.",
    createdAtDisplay: "20 июня 2026",
  },
  {
    id: "demo-review-2",
    name: "Евгений",
    rating: 5,
    text: "Доставили вовремя, букет выглядел именно так, как обещали. Очень аккуратная работа.",
    createdAtDisplay: "18 июня 2026",
  },
  {
    id: "demo-review-3",
    name: "Ольга",
    rating: 5,
    text: "Приятный сервис и красивые розы — оформление выглядело по-настоящему премиально.",
    createdAtDisplay: "15 июня 2026",
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

const TELEGRAM_USERNAME = "borziy_Sadikhov";
void TELEGRAM_USERNAME;
const LOCAL_ORDERS_STORAGE_KEY = "bellaflore-dev-orders";
const LOCAL_FAVORITES_STORAGE_KEY = "bellaflore-favorite-bouquets";
const LOCAL_CART_STORAGE_KEY = "bellaflore-cart";

function resolveProfileCourierStatus(status: BellafloreOrderStatus): string {
  if (status === "COURIER_ASSIGNED") {
    return "Курьер назначен";
  }

  if (status === "OUT_FOR_DELIVERY") {
    return "Курьер в пути";
  }

  if (status === "DELIVERED") {
    return "Доставлено";
  }

  return "Курьер будет назначен";
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

function readStoredFavoriteBouquetIds(catalog: { id: string }[]): string[] {
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

    const bouquetIds = new Set(catalog.map((bouquet) => bouquet.id));
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

function readStoredCartItems(catalog: CatalogProduct[]): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedCart = window.localStorage.getItem(LOCAL_CART_STORAGE_KEY);
    const parsedCart = storedCart ? JSON.parse(storedCart) : [];

    if (!Array.isArray(parsedCart)) {
      return [];
    }

    const bouquetIds = new Set(catalog.map((bouquet) => bouquet.id));
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

      const bouquet = catalog.find((entry) => entry.id === item.bouquetId);
      if (!bouquet) {
        return [];
      }

      const sizeId =
        item.sizeId === "S" ||
        item.sizeId === "M" ||
        item.sizeId === "L" ||
        item.sizeId === "XL"
          ? (item.sizeId as ProductSizeId)
          : getProductExperienceData(bouquet).defaultSizeId;
      const experienceData = getProductExperienceData(bouquet);
      const selectedVariant = getProductSizeVariant(experienceData, sizeId);

      return [
        {
          bouquetId: item.bouquetId,
          quantity: Math.min(Math.floor(item.quantity), 99),
          sizeId,
          priceRub:
            typeof item.priceRub === "number" && Number.isFinite(item.priceRub)
              ? item.priceRub
              : selectedVariant.priceRub,
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

export default function Home() {
  const { catalog: bouquets, isReady: catalogReady } =
    usePublicStorefrontCatalog();
  // ==================================================
  // SECTION: STATE
  // РАЗДЕЛ: Состояние
  //
  // Purpose (EN): React state for navigation, panels, cart, checkout, orders, reviews, and scroll behavior.
  //
  // Назначение (RU): React-состояние навигации, панелей, корзины, checkout, заказов, отзывов и скролла.
  // ==================================================
  const [contactHubOpen, setContactHubOpen] = useState(false);
  const [favoriteBouquetIds, setFavoriteBouquetIds] = useState<string[]>([]);
  const [favoritesRestored, setFavoritesRestored] = useState(false);
  const [favoritesPanelOpen, setFavoritesPanelOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartRestored, setCartRestored] = useState(false);
  const [checkoutPanelOpen, setCheckoutPanelOpen] = useState(false);
  const [myOrderPanelOpen, setMyOrderPanelOpen] = useState(false);
  const [closingBottomNavPanel, setClosingBottomNavPanel] =
    useState<BottomNavPanelId | null>(null);
  const bottomNavCloseTimerRef = useRef<number | null>(null);
  const [profileActiveSection, setProfileActiveSection] =
    useState<ProfileHubSectionId | null>(null);
  const [showOrdersOnly, setShowOrdersOnly] = useState(false);
  const [publicAppView, setPublicAppView] = useState<PublicAppView>("home");
  const [catalogFocusNonce, setCatalogFocusNonce] = useState(0);
  const [productExperienceId, setProductExperienceId] = useState<string | null>(
    null,
  );
  const [productFailedImageIds, setProductFailedImageIds] = useState<Set<string>>(
    () => new Set(),
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
  const [checkoutOrderPayload, setCheckoutOrderPayload] =
    useState<CheckoutOrderPayload | null>(null);
  const [confirmedOrders, setConfirmedOrders] = useState<BellafloreOrder[]>([]);
  const [latestOrderId, setLatestOrderId] = useState("");
  const [bottomNavAction, setBottomNavAction] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [bottomNavCompact, setBottomNavCompact] = useState(false);
  const lastTouchActionRef = useRef(0);
  const favoritesTouchedRef = useRef(false);
  const checkoutSubmitInProgressRef = useRef(false);
  const [checkoutSubmitInProgress, setCheckoutSubmitInProgress] = useState(false);
  const [checkoutSubmitError, setCheckoutSubmitError] = useState<string | null>(
    null,
  );
  void checkoutOrderPayload;

  const syncStoredOrdersWithBackend = async () => {
    const storedOrders = readStoredOrders();

    if (storedOrders.length === 0) {
      setConfirmedOrders([]);
      return;
    }

    try {
      const response = await fetch(getOrdersUrl(), { cache: "no-store" });

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
    if (!catalogReady) {
      return;
    }

    const restoreTimer = window.setTimeout(() => {
      if (!favoritesTouchedRef.current) {
        setFavoriteBouquetIds(readStoredFavoriteBouquetIds(bouquets));
      }
      setFavoritesRestored(true);
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, [bouquets, catalogReady]);

  useEffect(() => {
    if (!catalogReady) {
      return;
    }

    const restoreTimer = window.setTimeout(() => {
      setCartItems(readStoredCartItems(bouquets));
      setCartRestored(true);
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, [bouquets, catalogReady]);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const storedOrders = readCheckoutOrders();
      setConfirmedOrders(storedOrders);
      setLatestOrderId(readLatestCheckoutOrderId(storedOrders));
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
    return () => {
      if (bottomNavCloseTimerRef.current !== null) {
        window.clearTimeout(bottomNavCloseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!contactHubOpen && !closingBottomNavPanel) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [closingBottomNavPanel, contactHubOpen]);

  useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      void syncStoredOrdersWithBackend();
    }, 0);

    return () => window.clearTimeout(syncTimer);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const logTapTarget = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      if (!touch) {
        return;
      }

      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      console.info("[bellaflore-tap-debug]", {
        x: touch.clientX,
        y: touch.clientY,
        tag: target?.tagName ?? null,
        className: target instanceof HTMLElement ? target.className : null,
        pointerEvents: target ? getComputedStyle(target).pointerEvents : null,
      });
    };

    document.addEventListener("touchend", logTapTarget, { passive: true });
    return () => document.removeEventListener("touchend", logTapTarget);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const getProductIdFromLocation = () => {
      const productParam = new URLSearchParams(window.location.search)
        .get("product")
        ?.trim();

      if (!productParam) {
        return null;
      }

      return findPublicStorefrontProduct(productParam, bouquets)?.id ?? null;
    };

    const hash = window.location.hash.replace(/^#/, "");
    const shouldOpenCatalog =
      window.location.pathname === "/catalog" ||
      hash === "catalog" ||
      SCROLL_SECTION_IDS.includes(
        hash as (typeof SCROLL_SECTION_IDS)[number],
      );

    if (shouldOpenCatalog) {
      queueMicrotask(() => {
        setPublicAppView("catalog");
        setCatalogFocusNonce((current) => current + 1);
      });
    }

    const handlePopState = () => {
      const nextHash = window.location.hash.replace(/^#/, "");
      const nextProductId = getProductIdFromLocation();

      setProductExperienceId(nextProductId);
      setPublicAppView(
        nextProductId ||
          window.location.pathname === "/catalog" ||
          nextHash === "catalog" ||
          SCROLL_SECTION_IDS.includes(
            nextHash as (typeof SCROLL_SECTION_IDS)[number],
          )
          ? "catalog"
          : "home",
      );
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [bouquets]);

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
    const count = cartItems.reduce(
      (total, cartItem) => total + cartItem.quantity,
      0,
    );
    if (count === 0) {
      return;
    }

    const availabilityTimer = window.setInterval(() => {
      setCheckoutAvailabilityNow(new Date());
    }, 60 * 1000);

    return () => window.clearInterval(availabilityTimer);
  }, [cartItems]);

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

  // ==================================================
  // SECTION: Bottom Nav Panel Handlers
  // РАЗДЕЛ: Обработчики панелей нижней навигации
  //
  // Purpose (EN): Open/close/toggle bottom-nav panels (catalog, favorites, contact, my order) with animated transitions.
  //
  // Назначение (RU): Открытие/закрытие/переключение панелей bottom nav (каталог, избранное, контакты, мой заказ) с анимацией.
  // ==================================================
  const clearBottomNavCloseTimer = () => {
    if (bottomNavCloseTimerRef.current !== null) {
      window.clearTimeout(bottomNavCloseTimerRef.current);
      bottomNavCloseTimerRef.current = null;
    }
  };

  const closeBottomNavPanelImmediate = (panel: BottomNavPanelId) => {
    switch (panel) {
      case "catalog":
        break;
      case "favorites":
        setFavoritesPanelOpen(false);
        break;
      case "contact":
        setContactHubOpen(false);
        break;
      case "myOrder":
        setMyOrderPanelOpen(false);
        break;
    }
  };

  const closeAllBottomNavPanelsImmediate = () => {
    clearBottomNavCloseTimer();
    setClosingBottomNavPanel(null);
    setFavoritesPanelOpen(false);
    setContactHubOpen(false);
    setMyOrderPanelOpen(false);
    setCheckoutPanelOpen(false);
  };

  const getActiveBottomNavPanel = (): BottomNavPanelId | null => {
    if (favoritesPanelOpen) {
      return "favorites";
    }

    if (contactHubOpen) {
      return "contact";
    }

    if (myOrderPanelOpen) {
      return "myOrder";
    }

    return null;
  };

  const isBottomNavPanelVisible = (panel: BottomNavPanelId) => {
    if (closingBottomNavPanel === panel) {
      return true;
    }

    switch (panel) {
      case "catalog":
        return false;
      case "favorites":
        return favoritesPanelOpen;
      case "contact":
        return contactHubOpen;
      case "myOrder":
        return myOrderPanelOpen;
      default:
        return false;
    }
  };

  const closeBottomNavPanel = (
    panel: BottomNavPanelId,
    animated = true,
  ) => {
    const isOpen =
      panel === "favorites"
        ? favoritesPanelOpen
        : panel === "contact"
          ? contactHubOpen
          : myOrderPanelOpen;

    if (!isOpen && closingBottomNavPanel !== panel) {
      return;
    }

    if (!animated) {
      clearBottomNavCloseTimer();
      setClosingBottomNavPanel(null);
      closeBottomNavPanelImmediate(panel);
      return;
    }

    clearBottomNavCloseTimer();
    setClosingBottomNavPanel(panel);
    bottomNavCloseTimerRef.current = window.setTimeout(() => {
      closeBottomNavPanelImmediate(panel);
      setClosingBottomNavPanel((currentPanel) =>
        currentPanel === panel ? null : currentPanel,
      );
      bottomNavCloseTimerRef.current = null;
    }, BOTTOM_NAV_PANEL_CLOSE_MS);
  };

  const prepareMyOrderPanelData = () => {
    const storedOrders = readCheckoutOrders();
    setConfirmedOrders(storedOrders);
    setLatestOrderId((currentOrderId) =>
      currentOrderId || readLatestCheckoutOrderId(storedOrders),
    );
    setShowOrdersOnly(false);
    return storedOrders;
  };

  const openCatalogView = () => {
    leaveProductExperience();
    setPublicAppView("catalog");
    setCatalogFocusNonce((current) => current + 1);
    setBottomNavAction("Каталог");
    if (typeof window !== "undefined" && window.location.pathname !== "/catalog") {
      window.history.pushState({}, "", "/catalog");
    }
    requestAnimationFrame(() => {
      document.getElementById("catalog")?.scrollIntoView({
        block: "start",
        behavior: "smooth",
      });
    });
  };

  const openBottomNavPanel = (panel: BottomNavPanelId) => {
    leaveProductExperience();

    if (panel === "catalog") {
      closeAllBottomNavPanelsImmediate();
      openCatalogView();
      return;
    }

    clearBottomNavCloseTimer();
    setClosingBottomNavPanel(null);
    setCheckoutPanelOpen(false);

    if (panel !== "favorites") {
      setFavoritesPanelOpen(false);
    }

    if (panel !== "contact") {
      setContactHubOpen(false);
    }

    if (panel !== "myOrder") {
      setMyOrderPanelOpen(false);
    }

    let storedOrders = readCheckoutOrders();

    if (panel === "myOrder") {
      storedOrders = prepareMyOrderPanelData();
      setProfileActiveSection(null);
    }

    switch (panel) {
      case "favorites":
        setFavoritesPanelOpen(true);
        break;
      case "contact":
        setContactHubOpen(true);
        break;
      case "myOrder":
        setMyOrderPanelOpen(true);
        break;
    }

    setBottomNavAction(
      getBottomNavPanelOpenMessage(panel, {
        favoriteCount: favoriteBouquetIds.length,
        hasOrders: storedOrders.length > 0,
      }),
    );
  };

  const toggleBottomNavPanel = (panel: BottomNavPanelId) => {
    const activePanel = getActiveBottomNavPanel();

    if (activePanel === panel && closingBottomNavPanel !== panel) {
      closeBottomNavPanel(panel, true);
      setBottomNavAction(getBottomNavPanelClosedMessage(panel));
      return;
    }

    if (closingBottomNavPanel === panel) {
      return;
    }

    openBottomNavPanel(panel);
  };

  const goHomeFromBottomNav = () => {
    leaveProductExperience();
    setCheckoutPanelOpen(false);
    const activePanel = getActiveBottomNavPanel();

    if (activePanel) {
      closeBottomNavPanel(activePanel, true);
    } else {
      closeAllBottomNavPanelsImmediate();
    }

    setBottomNavAction("Главная");
    setPublicAppView("home");
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.history.pushState({}, "", "/");
    }
    requestAnimationFrame(() => {
      document.getElementById("home")?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const closeContactHub = () => closeBottomNavPanel("contact", true);
  const closeFavoritesPanel = () => closeBottomNavPanel("favorites", true);
  const closeCheckoutPanel = () => setCheckoutPanelOpen(false);
  const closeMyOrderPanel = () => {
    setProfileActiveSection(null);
    closeBottomNavPanel("myOrder", true);
  };

  const didHandleRecentTouch = (eventTimeStamp: number) =>
    eventTimeStamp - lastTouchActionRef.current < 450;

  const toggleContactHub = () => {
    toggleBottomNavPanel("contact");
  };

  const handleContactNavClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (didHandleRecentTouch(event.timeStamp)) {
      return;
    }

    toggleContactHub();
  };

  const handleContactNavTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    lastTouchActionRef.current = event.timeStamp;
    toggleContactHub();
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
          closeBottomNavPanel("favorites", true);
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
    if (!bouquet) {
      return [];
    }

    const experienceData = getProductExperienceData(bouquet);
    const selectedVariant = getProductSizeVariant(
      experienceData,
      cartItem.sizeId,
    );

    return [
      {
        ...cartItem,
        sizeLabel: selectedVariant.label,
        sizeVariants: experienceData.sizeVariants,
        bouquet: {
          ...bouquet,
          priceRub: cartItem.priceRub ?? selectedVariant.priceRub,
        },
      },
    ];
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
  const realDeliveryZoneResult = useRealDeliveryZoneForCheckout(
    checkoutForm.address,
  );
  const deliveryPriceResult = useMemo(
    () => resolveDeliveryPriceFromZone(realDeliveryZoneResult),
    [realDeliveryZoneResult],
  );
  const deliveryConfidenceResult = useMemo(
    () =>
      resolveDeliveryConfidence(
        checkoutTotalPrice,
        deliveryPriceResult,
        undefined,
        {
          deliveryDate: checkoutForm.deliveryDate,
          deliveryInterval: checkoutForm.deliveryTime,
          now: checkoutAvailabilityNow,
        },
      ),
    [
      checkoutTotalPrice,
      deliveryPriceResult,
      checkoutForm.deliveryDate,
      checkoutForm.deliveryTime,
      checkoutAvailabilityNow,
    ],
  );
  const checkoutGrandTotalPrice = calculateCheckoutGrandTotalWithConfidence(
    checkoutTotalPrice,
    deliveryPriceResult,
    undefined,
    {
      deliveryDate: checkoutForm.deliveryDate,
      deliveryInterval: checkoutForm.deliveryTime,
      now: checkoutAvailabilityNow,
    },
  );
  const deliveryValidationResult = useMemo(
    () =>
      resolveDeliveryValidationForCheckout(
        checkoutForm.address,
        realDeliveryZoneResult,
      ),
    [checkoutForm.address, realDeliveryZoneResult],
  );

  const formatPrice = (priceRub: number) =>
    `${priceRub.toLocaleString("ru-RU")} ₽`;
  const renderRatingStars = (rating: number) =>
    Array.from({ length: 5 }, (_, index) =>
      index < rating ? "★" : "☆",
    ).join("");
  const latestOrder =
    customerOrders.find((order) => order.orderId === latestOrderId) ??
    customerOrders[customerOrders.length - 1];

  const orderPassport = useMemo((): OrderPassportData | null => {
    if (latestOrder) {
      const primary = latestOrder.items[0];
      const bouquetsTotal = latestOrder.items.reduce(
        (sum, item) => sum + item.lineTotalRub,
        0,
      );
      const paymentLabel =
        paymentMethodLabels[
          latestOrder.paymentMethod as keyof typeof paymentMethodLabels
        ] ?? latestOrder.paymentMethod;

      return {
        recipientName: latestOrder.customerName,
        phone: latestOrder.customerPhone,
        address: latestOrder.deliveryAddress ?? "",
        deliveryDate: latestOrder.deliveryDate ?? "",
        deliveryTime: latestOrder.deliveryTime ?? "",
        paymentMethod: paymentLabel,
        bouquetName: primary
          ? primary.quantity > 1
            ? `${primary.bouquetName} ×${primary.quantity}`
            : primary.bouquetName
          : "",
        productPriceRub: bouquetsTotal,
        deliveryPriceRub: latestOrder.deliveryZonePriceRub ?? null,
        totalRub: latestOrder.totalPriceRub,
        orderStatus: getCustomerOrderStatusLabel(latestOrder),
        courierStatus: resolveProfileCourierStatus(latestOrder.status),
        hasConfirmedOrder: true,
      };
    }

    if (cartItemCount > 0) {
      const primary = cartBouquets[0];

      return {
        recipientName: checkoutForm.name,
        phone: checkoutForm.phone,
        address: checkoutForm.address,
        deliveryDate: checkoutForm.deliveryDate,
        deliveryTime: checkoutForm.deliveryTime,
        paymentMethod: "",
        bouquetName: primary
          ? primary.quantity > 1
            ? `${primary.bouquet.title} ×${primary.quantity}`
            : primary.bouquet.title
          : "",
        productPriceRub: checkoutTotalPrice,
        deliveryPriceRub: deliveryPriceResult.deliveryPriceRub ?? null,
        totalRub: checkoutGrandTotalPrice,
        orderStatus: "Оформление",
        courierStatus: "Курьер будет назначен",
        hasConfirmedOrder: false,
      };
    }

    return null;
  }, [
    latestOrder,
    cartItemCount,
    cartBouquets,
    checkoutForm.name,
    checkoutForm.phone,
    checkoutForm.address,
    checkoutForm.deliveryDate,
    checkoutForm.deliveryTime,
    checkoutTotalPrice,
    deliveryPriceResult.deliveryPriceRub,
    checkoutGrandTotalPrice,
  ]);

  const hasDraftOrder = Boolean(latestOrder) || cartItemCount > 0;

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

  const resolveBouquetSelection = (
    bouquetId: string,
    sizeId: ProductSizeId = "S",
    priceRub?: number,
  ) => {
    const bouquet = bouquets.find((item) => item.id === bouquetId);
    if (!bouquet) {
      return null;
    }

    const experienceData = getProductExperienceData(bouquet);
    const selectedVariant = getProductSizeVariant(
      experienceData,
      sizeId,
    );

    return {
      bouquet,
      sizeId: selectedVariant.sizeId,
      sizeLabel: selectedVariant.label,
      priceRub:
        typeof priceRub === "number" && Number.isFinite(priceRub)
          ? priceRub
          : selectedVariant.priceRub,
    };
  };

  // ==================================================
  // SECTION: Cart Handlers
  // РАЗДЕЛ: Обработчики корзины
  //
  // Purpose (EN): Add, remove, and adjust cart item quantities with touch-safe click handlers.
  //
  // Назначение (RU): Добавление, удаление и изменение количества позиций корзины с touch-safe обработчиками.
  // ==================================================
  const addBouquetToCart = (
    bouquetId: string,
    sizeId: ProductSizeId,
    priceRub?: number,
  ) => {
    const selection = resolveBouquetSelection(bouquetId, sizeId, priceRub);
    if (!selection) {
      return;
    }

    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.bouquetId === bouquetId && item.sizeId === selection.sizeId,
      );

      setBottomNavAction("Букет добавлен в корзину");

      if (!existingItem) {
        return [
          ...currentItems,
          {
            bouquetId,
            quantity: 1,
            sizeId: selection.sizeId,
            priceRub: selection.priceRub,
          },
        ];
      }

      return currentItems.map((item) =>
        item.bouquetId === bouquetId && item.sizeId === selection.sizeId
          ? { ...item, quantity: item.quantity + 1, priceRub: selection.priceRub }
          : item,
      );
    });
  };

  const removeBouquetFromCart = (bouquetId: string, sizeId: ProductSizeId) => {
    setCartItems((currentItems) =>
      currentItems.filter(
        (item) => item.bouquetId !== bouquetId || item.sizeId !== sizeId,
      ),
    );
  };

  const decreaseCartItemQuantity = (
    bouquetId: string,
    sizeId: ProductSizeId,
  ) => {
    setCartItems((currentItems) =>
      currentItems.flatMap((item) => {
        if (item.bouquetId !== bouquetId || item.sizeId !== sizeId) {
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

  const increaseCartItemQuantity = (
    bouquetId: string,
    sizeId: ProductSizeId,
  ) => {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.bouquetId === bouquetId && item.sizeId === sizeId
          ? { ...item, quantity: Math.min(item.quantity + 1, 99) }
          : item,
      ),
    );
    setBottomNavAction("Количество обновлено");
  };

  const handleCartAddClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId,
    priceRub: number,
  ) => {
    event.preventDefault();

    if (didHandleRecentTouch(event.timeStamp)) {
      return;
    }

    addBouquetToCart(bouquetId, sizeId, priceRub);
  };

  const handleCartAddTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId,
    priceRub: number,
  ) => {
    event.preventDefault();
    lastTouchActionRef.current = event.timeStamp;
    addBouquetToCart(bouquetId, sizeId, priceRub);
  };

  void handleCartAddClick;
  void handleCartAddTouchEnd;

  const handleCartRemoveClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId,
  ) => {
    event.preventDefault();

    if (didHandleRecentTouch(event.timeStamp)) {
      return;
    }

    removeBouquetFromCart(bouquetId, sizeId);
    setBottomNavAction("Букет удалён из корзины");
  };

  const handleCartRemoveTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId,
  ) => {
    event.preventDefault();
    lastTouchActionRef.current = event.timeStamp;
    removeBouquetFromCart(bouquetId, sizeId);
    setBottomNavAction("Букет удалён из корзины");
  };

  const handleCartDecreaseClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId,
  ) => {
    event.preventDefault();

    if (didHandleRecentTouch(event.timeStamp)) {
      return;
    }

    decreaseCartItemQuantity(bouquetId, sizeId);
  };

  const handleCartDecreaseTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId,
  ) => {
    event.preventDefault();
    lastTouchActionRef.current = event.timeStamp;
    decreaseCartItemQuantity(bouquetId, sizeId);
  };

  const handleCartIncreaseClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId,
  ) => {
    event.preventDefault();

    if (didHandleRecentTouch(event.timeStamp)) {
      return;
    }

    increaseCartItemQuantity(bouquetId, sizeId);
  };

  const handleCartIncreaseTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId,
  ) => {
    event.preventDefault();
    lastTouchActionRef.current = event.timeStamp;
    increaseCartItemQuantity(bouquetId, sizeId);
  };

  void handleCartRemoveClick;
  void handleCartRemoveTouchEnd;
  void handleCartDecreaseClick;
  void handleCartDecreaseTouchEnd;
  void handleCartIncreaseClick;
  void handleCartIncreaseTouchEnd;

  const updateCheckoutPrimarySize = (sizeId: ProductSizeId) => {
    const primaryItem = cartItems[0];
    if (!primaryItem) {
      return;
    }

    const selection = resolveBouquetSelection(primaryItem.bouquetId, sizeId);
    if (!selection) {
      return;
    }

    setCartItems((currentItems) =>
      currentItems.map((item, index) =>
        index === 0
          ? {
              ...item,
              sizeId: selection.sizeId,
              priceRub: selection.priceRub,
            }
          : item,
      ),
    );
    setBottomNavAction("Размер обновлён");
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

    toggleBottomNavPanel("favorites");
  };

  const handleFavoritesNavTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    lastTouchActionRef.current = event.timeStamp;
    toggleBottomNavPanel("favorites");
  };

  // ==================================================
  // SECTION: Favorites & Catalog Search Handlers
  // РАЗДЕЛ: Обработчики избранного и поиска каталога
  //
  // Purpose (EN): Toggle favorites, route buy actions to product PDP, and manage catalog search query.
  //
  // Назначение (RU): Переключение избранного, маршрутизация покупки на карточку товара и управление запросом каталога.
  // ==================================================
  const handleSearchNavClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (didHandleRecentTouch(event.timeStamp)) {
      return;
    }

    closeAllBottomNavPanelsImmediate();
    openCatalogView();
  };

  const handleSearchNavTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    lastTouchActionRef.current = event.timeStamp;
    closeAllBottomNavPanelsImmediate();
    openCatalogView();
  };

  const handleHomeNavClick = (
    event: ReactMouseEvent<HTMLAnchorElement>,
  ) => {
    event.preventDefault();

    if (didHandleRecentTouch(event.timeStamp)) {
      return;
    }

    goHomeFromBottomNav();
  };

  const handleHomeNavTouchEnd = (
    event: ReactTouchEvent<HTMLAnchorElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    lastTouchActionRef.current = event.timeStamp;
    goHomeFromBottomNav();
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

  const openCheckoutPanel = () => {
    initializeCheckoutDeliveryDate();
    closeAllBottomNavPanelsImmediate();
    setShowOrdersOnly(false);
    setCheckoutPanelOpen(true);
    setBottomNavAction(
      cartItemCount > 0 ? "Оформление заказа" : "Корзина пока пуста",
    );
  };

  const prepareProductCheckout = (
    bouquetId: string,
    sizeId: ProductSizeId,
    priceRub?: number,
  ) => {
    const selection = resolveBouquetSelection(bouquetId, sizeId, priceRub);

    if (!selection) {
      return;
    }

    setCartItems([
      {
        bouquetId,
        quantity: 1,
        sizeId: selection.sizeId,
        priceRub: selection.priceRub,
      },
    ]);
    openCheckoutPanel();
    setBottomNavAction("Букет подготовлен к покупке");
  };

  const handleFavoriteBuyClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId,
    priceRub: number,
  ) => {
    event.preventDefault();

    if (didHandleRecentTouch(event.timeStamp)) {
      return;
    }

    prepareProductCheckout(bouquetId, sizeId, priceRub);
  };

  const handleHeroOrderBouquet = () => {
    openCatalogView();
  };

  const scrollToHomeSection = (sectionId: string) => {
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  };

  useEffect(() => {
    if (publicAppView !== "catalog" || typeof window === "undefined") {
      return;
    }

    const sectionId = window.location.hash.replace(/^#/, "");
    if (
      !SCROLL_SECTION_IDS.includes(
        sectionId as (typeof SCROLL_SECTION_IDS)[number],
      )
    ) {
      return;
    }

    scrollToHomeSection(sectionId);
  }, [publicAppView]);

  const handleTopNavNavigate = (href: string) => {
    closeAllBottomNavPanelsImmediate();

    if (href === "#home") {
      goHomeFromBottomNav();
      return;
    }

    if (href === "#catalog") {
      openCatalogView();
      return;
    }

    const sectionId = href.replace(/^#/, "");
    if (
      SCROLL_SECTION_IDS.includes(
        sectionId as (typeof SCROLL_SECTION_IDS)[number],
      )
    ) {
      setPublicAppView("catalog");
      if (typeof window !== "undefined" && window.location.pathname !== "/catalog") {
        window.history.pushState({}, "", `/catalog#${sectionId}`);
      } else if (typeof window !== "undefined") {
        window.history.replaceState({}, "", `/catalog#${sectionId}`);
      }
      scrollToHomeSection(sectionId);
      return;
    }

    goHomeFromBottomNav();
  };

  const handleBouquetOrderClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
    bouquetId: string,
    sizeId: ProductSizeId = "S",
    priceRub?: number,
  ) => {
    event.preventDefault();

    if (didHandleRecentTouch(event.timeStamp)) {
      return;
    }

    prepareProductCheckout(bouquetId, sizeId, priceRub);
  };

  const openMyOrderAfterCheckout = (orderId: string) => {
    closeAllBottomNavPanelsImmediate();
    setCheckoutPanelOpen(false);
    setShowOrdersOnly(false);
    setLatestOrderId(orderId);
    writeLatestCheckoutOrderId(orderId);
    prepareMyOrderPanelData();
    setProfileActiveSection("myOrder");
    setMyOrderPanelOpen(true);
    setBottomNavAction(CHECKOUT_ORDER_CREATED_STATUS);
  };

  const handleMyOrderNavClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (didHandleRecentTouch(event.timeStamp)) {
      return;
    }

    toggleBottomNavPanel("myOrder");
  };

  const handleMyOrderNavTouchEnd = (
    event: ReactTouchEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    lastTouchActionRef.current = event.timeStamp;
    toggleBottomNavPanel("myOrder");
  };

  const markProductImageFailed = (imageId: string) => {
    setProductFailedImageIds((current) => {
      if (current.has(imageId)) {
        return current;
      }

      const next = new Set(current);
      next.add(imageId);
      return next;
    });
  };

  const leaveProductExperience = () => {
    setProductExperienceId(null);

    if (typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);
    if (!url.searchParams.has("product")) {
      return;
    }

    url.searchParams.delete("product");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  };

  const openProductExperience = (bouquetId: string) => {
    closeAllBottomNavPanelsImmediate();
    setPublicAppView("catalog");
    setProductExperienceId(bouquetId);

    if (typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);
    const alreadyOnProductRoute = url.searchParams.has("product");
    url.pathname = "/";
    url.search = "";
    url.searchParams.set("product", bouquetId);
    url.hash = "catalog";

    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    if (alreadyOnProductRoute) {
      window.history.replaceState({}, "", nextUrl);
    } else {
      window.history.pushState({}, "", nextUrl);
    }
  };

  const closeProductExperience = () => {
    leaveProductExperience();
  };

  const activeProductExperience = useMemo(
    () => bouquets.find((item) => item.id === productExperienceId) ?? null,
    [bouquets, productExperienceId],
  );

  useEffect(() => {
    if (!catalogReady || typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const productParam = params.get("product")?.trim();
    if (!productParam) {
      return;
    }

    const matchedProduct = findPublicStorefrontProduct(productParam, bouquets);
    if (!matchedProduct) {
      return;
    }

    queueMicrotask(() => {
      setProductExperienceId(matchedProduct.id);
      setPublicAppView("catalog");
      setCatalogFocusNonce((current) => current + 1);
    });

    const catalogSection = document.getElementById("catalog");
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [bouquets, catalogReady]);

  useEffect(() => {
    if (!activeProductExperience || typeof document === "undefined") {
      return;
    }

    const previousTitle = document.title;
    const seoTitle =
      activeProductExperience.seoTitle?.trim() || activeProductExperience.title;
    document.title = `${seoTitle} | Bellaflore`;

    const metaDescription = document.querySelector('meta[name="description"]');
    const previousDescription = metaDescription?.getAttribute("content") ?? "";
    if (metaDescription && activeProductExperience.seoDescription?.trim()) {
      metaDescription.setAttribute(
        "content",
        activeProductExperience.seoDescription.trim(),
      );
    }

    return () => {
      document.title = previousTitle;
      if (metaDescription && previousDescription) {
        metaDescription.setAttribute("content", previousDescription);
      }
    };
  }, [activeProductExperience]);

  const productFailedImages = useMemo(
    () => new Set(productFailedImageIds),
    [productFailedImageIds],
  );

  const handleProductExperienceBuy = (
    productId: string,
    sizeId: ProductSizeId,
    priceRub: number,
  ) => {
    prepareProductCheckout(productId, sizeId, priceRub);
    closeProductExperience();
  };

  const handleCheckoutFieldChange = (
    field: keyof CheckoutForm,
    value: CheckoutForm[keyof CheckoutForm],
  ) => {
    setCheckoutSubmitError(null);
    setCheckoutForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  // ==================================================
  // SECTION: Review Handlers
  // РАЗДЕЛ: Обработчики отзывов
  //
  // Purpose (EN): Review form field changes and local review submission with validation.
  //
  // Назначение (RU): Изменение полей формы отзыва и локальная отправка отзыва с валидацией.
  // ==================================================
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
  };

  const confirmCheckoutOrder = async () => {
    if (checkoutSubmitInProgressRef.current) {
      return;
    }

    if (cartItemCount === 0) {
      setBottomNavAction("Корзина пока пуста");
      return;
    }

    const payload = buildCheckoutOrderPayload(
      checkoutForm,
      cartBouquets,
      checkoutAvailabilityNow,
      deliveryPriceResult,
      realDeliveryZoneResult,
      deliveryValidationResult,
      deliveryConfidenceResult,
    );

    if (!payload) {
      if (!canSubmitCheckoutWithDeliveryValidation(deliveryValidationResult)) {
        setCheckoutSubmitError(
          getDeliveryValidationUnavailableMessage(deliveryValidationResult) ??
            "Delivery address validation failed.",
        );
      } else if (!canSubmitCheckoutWithDeliveryPrice(deliveryPriceResult)) {
        setCheckoutSubmitError(
          getDeliveryPriceUnavailableMessage(deliveryPriceResult.status) ??
            "Delivery is unavailable for this address.",
        );
      } else {
        setBottomNavAction("Заполните обязательные поля");
      }
      return;
    }

    checkoutSubmitInProgressRef.current = true;
    setCheckoutSubmitInProgress(true);
    setCheckoutSubmitError(null);

    try {
      const storedOrders = readCheckoutOrders();
      const orderId = `BF-${1001 + storedOrders.length}`;
      const telegramResult = await submitCheckoutOrderToTelegram({
        orderId,
        payload,
        totalPriceRub: checkoutGrandTotalPrice,
        cardMessage: checkoutForm.cardMessage,
      });

      if (!telegramResult.ok) {
        setCheckoutSubmitError(telegramResult.message);
        return;
      }

      setCheckoutOrderPayload(payload);

      const order = buildCheckoutStoredOrder({
        orderId,
        payload,
        totalPriceRub: checkoutGrandTotalPrice,
        cardMessage: checkoutForm.cardMessage,
        paymentMethodLabel: paymentMethodLabels.cardTransfer,
      });
      const nextOrders = [...storedOrders, order];

      setConfirmedOrders(nextOrders);
      writeCheckoutOrders(nextOrders);
      const logisticsOrder = createAndSaveLogisticsOrderFromCheckout({
        orderId,
        payload,
        totalPriceRub: checkoutGrandTotalPrice,
        deliveryConfidenceResult,
      });
      bootstrapCrmFromLogisticsAndLifecycle(
        logisticsOrder,
        createOrderLifecycle(logisticsOrder),
      );
      persistOrderIntelligenceFromCheckout({
        orderId,
        payload,
        totalPriceRub: checkoutGrandTotalPrice,
        cardMessage: checkoutForm.cardMessage,
        paymentMethodLabel: paymentMethodLabels.cardTransfer,
      });
      createAndSaveOrderLifecycleFromLogisticsOrder(logisticsOrder);
      writeLatestCheckoutOrderId(orderId);
      setLatestOrderId(orderId);
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
      openMyOrderAfterCheckout(orderId);
    } finally {
      checkoutSubmitInProgressRef.current = false;
      setCheckoutSubmitInProgress(false);
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

  const renderCheckoutSection = () => (
    <CheckoutSection
      embedded
      checkoutForm={checkoutForm}
      deliveryDateMode={deliveryDateMode}
      todayDateValue={todayDateValue}
      availableDeliveryIntervals={availableDeliveryIntervals}
      cartBouquets={cartBouquets}
      checkoutTotalPrice={checkoutTotalPrice}
      checkoutGrandTotalPrice={checkoutGrandTotalPrice}
      checkoutValidationNow={checkoutAvailabilityNow}
      cartItemCount={cartItemCount}
      formatPrice={formatPrice}
      handleCheckoutFieldChange={handleCheckoutFieldChange}
      selectDeliveryDatePreset={selectDeliveryDatePreset}
      handleCustomDeliveryDateChange={handleCustomDeliveryDateChange}
      handleConfirmOrderClick={handleConfirmOrderClick}
      handleConfirmOrderTouchEnd={handleConfirmOrderTouchEnd}
      onCheckoutSizeSelect={updateCheckoutPrimarySize}
      checkoutSubmitInProgress={checkoutSubmitInProgress}
      checkoutSubmitError={checkoutSubmitError}
      realDeliveryZoneResult={realDeliveryZoneResult}
      deliveryPriceResult={deliveryPriceResult}
      deliveryConfidenceResult={deliveryConfidenceResult}
      deliveryValidationResult={deliveryValidationResult}
    />
  );

  const renderMyOrderHub = () => (
    <MyOrderHub
      passport={orderPassport}
      hasDraftOrder={hasDraftOrder}
      favoritesCount={favoriteBouquetIds.length}
      activeSection={profileActiveSection}
      onActiveSectionChange={setProfileActiveSection}
      onClose={closeMyOrderPanel}
      onOpenCatalog={() => {
        closeMyOrderPanel();
        openBottomNavPanel("catalog");
      }}
      onOpenFavorites={() => {
        closeMyOrderPanel();
        openBottomNavPanel("favorites");
      }}
      onOpenContact={() => {
        closeMyOrderPanel();
        openBottomNavPanel("contact");
      }}
      formatPrice={formatPrice}
    />
  );

  return (
    <>
      {/* ==================================================
          SECTION: Navbar
          РАЗДЕЛ: Навбар

          Purpose (EN): Top navigation bar with scroll state and mobile menu toggle.

          Назначение (RU): Верхняя навигация со состоянием скролла и переключателем мобильного меню.
          ================================================== */}
      <Navbar
          navigationItems={navigationItems}
          scrolled={scrolled}
          elevated={Boolean(activeProductExperience)}
          onNavigate={handleTopNavNavigate}
        />

      {/* ==================================================
          SECTION: Hero
          РАЗДЕЛ: Hero-секция

          Purpose (EN): Full-viewport hero with brand imagery and primary call-to-action.

          Назначение (RU): Hero на весь экран с брендовым изображением и основным призывом к действию.
          ================================================== */}
      <HeroSection onOrderBouquet={handleHeroOrderBouquet} />

      {publicAppView === "catalog" ? (
        <>
          <CollectionsSection
            bouquets={bouquets}
            favoriteBouquetIds={favoriteBouquetIds}
            formatPrice={formatPrice}
            handleFavoriteClick={handleFavoriteClick}
            handleBouquetOrderClick={handleBouquetOrderClick}
            onProductOpen={openProductExperience}
            catalogFocusNonce={catalogFocusNonce}
          />
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
        </>
      ) : null}

      {/* ==================================================
          SECTION: Favorites Panel
          РАЗДЕЛ: Панель избранного

          Purpose (EN): Bottom-nav favorites overlay — saved bouquets with buy and remove actions.

          Назначение (RU): Оверлей избранного bottom nav — сохранённые букеты с покупкой и удалением.
          ================================================== */}
      {isBottomNavPanelVisible("favorites") && (
        <BottomNavPanelFrame
          closing={closingBottomNavPanel === "favorites"}
        >
          <FavoritesPanel
            favoriteBouquetIds={favoriteBouquetIds}
            favoriteBouquets={favoriteBouquets}
            formatPrice={formatPrice}
            onCloseFavoritesPanel={closeFavoritesPanel}
            handleFavoriteRemoveClick={handleFavoriteRemoveClick}
            handleFavoriteBuyClick={handleFavoriteBuyClick}
          />
        </BottomNavPanelFrame>
      )}

      {checkoutPanelOpen && (
        <CheckoutPanel closeCheckoutPanel={closeCheckoutPanel}>
          {renderCheckoutSection()}
        </CheckoutPanel>
      )}

      {/* ==================================================
          SECTION: My Order Panel
          РАЗДЕЛ: Панель «Мой заказ»

          Purpose (EN): Bottom-nav my-order overlay — latest order card or empty state.

          Назначение (RU): Оверлей «Мой заказ» bottom nav — карточка последнего заказа или пустое состояние.
          ================================================== */}
      {isBottomNavPanelVisible("myOrder") && (
        <BottomNavPanelFrame
          closing={closingBottomNavPanel === "myOrder"}
        >
          <MyOrderPanel closeMyOrderPanel={closeMyOrderPanel}>
            {renderMyOrderHub()}
          </MyOrderPanel>
        </BottomNavPanelFrame>
      )}

      {/* ==================================================
          SECTION: Orders
          РАЗДЕЛ: Заказы

          Purpose (EN): Full-page orders section showing the latest customer order.

          Назначение (RU): Полноэкранная секция заказов с последним заказом клиента.
          ================================================== */}
      {showOrdersOnly && (
        <OrdersSection>
          {renderMyOrderHub()}
        </OrdersSection>
      )}

      {activeProductExperience ? (
        <ProductExperiencePage
          key={activeProductExperience.id}
          product={activeProductExperience}
          allProducts={bouquets}
          formatPrice={formatPrice}
          isFavorite={favoriteBouquetIds.includes(activeProductExperience.id)}
          failedImageIds={productFailedImages}
          deliveryAddress={checkoutForm.address}
          zoneResult={realDeliveryZoneResult}
          deliveryDate={checkoutForm.deliveryDate}
          deliveryTime={checkoutForm.deliveryTime}
          nearestFromConfidence={
            deliveryConfidenceResult.nearestAvailableInterval
          }
          checkoutNow={checkoutAvailabilityNow}
          onClose={closeProductExperience}
          onBuy={handleProductExperienceBuy}
          onToggleFavorite={toggleFavoriteBouquet}
          onProductSelect={openProductExperience}
          onImageError={markProductImageFailed}
        />
      ) : null}

      {/* ==================================================
          SECTION: Mobile Bottom Nav
          РАЗДЕЛ: Мобильная нижняя навигация

          Purpose (EN): Fixed mobile bottom bar — catalog, favorites, contact, my order, and home shortcuts.

          Назначение (RU): Фиксированная нижняя панель mobile — каталог, избранное, контакты, мой заказ и главная.
          ================================================== */}
      <MobileBottomNav
        bottomNavCompact={bottomNavCompact}
        bottomNavAction={bottomNavAction}
        contactHubOpen={contactHubOpen}
        favoritesPanelOpen={favoritesPanelOpen}
        myOrderPanelOpen={myOrderPanelOpen}
        favoriteBouquetIds={favoriteBouquetIds}
        cartItemCount={cartItemCount}
        publicAppView={publicAppView}
        handleSearchNavClick={handleSearchNavClick}
        handleSearchNavTouchEnd={handleSearchNavTouchEnd}
        handleContactNavClick={handleContactNavClick}
        handleContactNavTouchEnd={handleContactNavTouchEnd}
        closeContactHub={closeContactHub}
        handleFavoritesNavClick={handleFavoritesNavClick}
        handleFavoritesNavTouchEnd={handleFavoritesNavTouchEnd}
        handleMyOrderNavClick={handleMyOrderNavClick}
        handleMyOrderNavTouchEnd={handleMyOrderNavTouchEnd}
        handleHomeNavClick={handleHomeNavClick}
        handleHomeNavTouchEnd={handleHomeNavTouchEnd}
      />

    </>
  );
}
