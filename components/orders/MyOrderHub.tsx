// ==================================================
// SECTION: MY PROFILE
// РАЗДЕЛ: Родительский хаб профиля (без регистрации)
// ==================================================
"use client";

import { ProfileHubDashboard } from "@/components/orders/ProfileHubDashboard";
import { ProfileHubPlaceholderSection } from "@/components/orders/ProfileHubPlaceholderSection";
import { ProfileHubSectionPanel } from "@/components/orders/ProfileHubSectionPanel";
import { ProfilePersonalSection } from "@/components/orders/ProfilePersonalSection";
import {
  MyOrderPassport,
  MyOrderPassportEmpty,
  type OrderPassportData,
} from "@/components/orders/MyOrderPassport";
import type { ProfileHubSectionId } from "@/components/orders/profileHubTypes";
import styles from "@/components/orders/MyOrderHub.module.css";

type MyOrderHubProps = {
  passport: OrderPassportData | null;
  hasDraftOrder: boolean;
  favoritesCount?: number;
  activeSection?: ProfileHubSectionId | null;
  onActiveSectionChange?: (sectionId: ProfileHubSectionId | null) => void;
  onClose: () => void;
  onOpenCatalog: () => void;
  onOpenFavorites?: () => void;
  onOpenContact: () => void;
  formatPrice: (priceRub: number) => string;
};

const SECTION_TITLES: Record<ProfileHubSectionId, string> = {
  personal: "Личные данные",
  myOrder: "Мой заказ",
  tracking: "Отслеживание заказа",
  favorites: "Избранное",
  contact: "Связь",
};

function resolveOrderMenuHint(
  passport: OrderPassportData | null,
  hasDraftOrder: boolean,
): string | null {
  if (!hasDraftOrder || !passport) {
    return "Не создан";
  }

  const status = passport.orderStatus.trim();
  return status.length > 0 ? status : null;
}

export function MyOrderHub({
  passport,
  hasDraftOrder,
  favoritesCount = 0,
  activeSection = null,
  onActiveSectionChange,
  onClose,
  onOpenCatalog,
  onOpenFavorites,
  onOpenContact,
  formatPrice,
}: MyOrderHubProps) {
  const navigateToSection = (sectionId: ProfileHubSectionId) => {
    onActiveSectionChange?.(sectionId);
  };

  const handleExternalAction = (sectionId: ProfileHubSectionId) => {
    if (sectionId === "favorites") {
      onOpenFavorites?.();
      return;
    }

    if (sectionId === "contact") {
      onOpenContact();
    }
  };

  const renderSectionContent = (sectionId: ProfileHubSectionId) => {
    switch (sectionId) {
      case "personal":
        return (
          <ProfilePersonalSection
            recipientName={passport?.recipientName ?? ""}
            phone={passport?.phone ?? ""}
          />
        );
      case "myOrder":
        return passport !== null && hasDraftOrder ? (
          <MyOrderPassport data={passport} formatPrice={formatPrice} />
        ) : (
          <MyOrderPassportEmpty onOpenCatalog={onOpenCatalog} />
        );
      case "tracking":
        return (
          <ProfileHubPlaceholderSection
            title="Отслеживание появится позже"
            message="Отслеживание появится после подтверждения заказа. Курьер будет назначен после подтверждения."
          />
        );
      default:
        return null;
    }
  };

  if (activeSection !== null) {
    return (
      <div className={styles.hub}>
        <ProfileHubSectionPanel
          title={SECTION_TITLES[activeSection]}
          onBack={() => onActiveSectionChange?.(null)}
        >
          {renderSectionContent(activeSection)}
        </ProfileHubSectionPanel>
      </div>
    );
  }

  return (
    <div className={styles.hub}>
      <ProfileHubDashboard
        favoritesCount={favoritesCount}
        orderHint={resolveOrderMenuHint(passport, hasDraftOrder)}
        onSelectSection={navigateToSection}
        onExternalAction={handleExternalAction}
      />
      <button type="button" className={styles.closeRow} onClick={onClose}>
        Закрыть
      </button>
    </div>
  );
}
