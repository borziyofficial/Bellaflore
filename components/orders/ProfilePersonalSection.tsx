// ==================================================
// SECTION: MY PROFILE
// РАЗДЕЛ: Личные данные (секция профиля)
//
// Purpose (EN):
// Editable name / phone / default delivery address, saved locally so
// checkout can be prefilled automatically next time. No registration
// required — this is a per-device convenience store, not an account.
//
// Назначение (RU):
// Редактируемые имя, телефон и адрес доставки по умолчанию — сохраняются
// локально, чтобы автоматически подставляться в checkout в следующий раз.
// Регистрация не требуется — это локальное удобство, а не аккаунт.
// ==================================================
"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  readCustomerProfile,
  writeCustomerProfile,
} from "@/components/orders/customerProfileStorage";
import styles from "@/components/orders/ProfilePersonalSection.module.css";

type ProfilePersonalSectionProps = {
  recipientName: string;
  phone: string;
};

export function ProfilePersonalSection({
  recipientName,
  phone,
}: ProfilePersonalSectionProps) {
  const [name, setName] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [defaultAddress, setDefaultAddress] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);

  // Seed the form once: prefer whatever was explicitly saved before, and
  // fall back to the name/phone known from the customer's most recent
  // order so the field isn't blank on a first visit. Deferred to a
  // microtask rather than set directly in the effect body.
  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(() => {
      if (cancelled) {
        return;
      }

      const saved = readCustomerProfile();
      setName(saved.name || recipientName);
      setPhoneValue(saved.phone || phone);
      setDefaultAddress(saved.defaultAddress);
    });

    return () => {
      cancelled = true;
    };
    // Intentionally runs once on mount — the saved profile is the source
    // of truth after that, not the order-derived defaults.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    writeCustomerProfile({
      name: name.trim(),
      phone: phoneValue.trim(),
      defaultAddress: defaultAddress.trim(),
    });
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2400);
  };

  return (
    <form
      className={styles.form}
      aria-label="Личные данные"
      onSubmit={handleSave}
    >
      <label className={styles.field}>
        <span className={styles.label}>Имя</span>
        <input
          type="text"
          className={styles.input}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Как к вам обращаться"
          autoComplete="name"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Телефон</span>
        <input
          type="tel"
          className={styles.input}
          value={phoneValue}
          onChange={(event) => setPhoneValue(event.target.value)}
          placeholder="+7 999 000-00-00"
          autoComplete="tel"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Адрес по умолчанию</span>
        <input
          type="text"
          className={styles.input}
          value={defaultAddress}
          onChange={(event) => setDefaultAddress(event.target.value)}
          placeholder="Улица, дом, квартира"
          autoComplete="street-address"
        />
      </label>

      <button type="submit" className={styles.saveButton}>
        Сохранить
      </button>

      {savedNotice ? (
        <p className={styles.savedNotice} role="status">
          Сохранено. Подставим в следующий заказ автоматически.
        </p>
      ) : null}
    </form>
  );
}
