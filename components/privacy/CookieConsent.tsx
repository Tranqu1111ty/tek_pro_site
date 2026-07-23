"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "tekpro-cookie-consent-v1";
const STORAGE_VERSION = 1;
const CONSENT_LIFETIME_MS = 365 * 24 * 60 * 60 * 1000;

type ConsentChoice = "accepted" | "rejected";

type StoredConsent = {
  choice: ConsentChoice;
  updatedAt: string;
  version: number;
};

function readStoredConsent(): StoredConsent | null {
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) return null;

    const value = JSON.parse(rawValue) as Partial<StoredConsent>;
    const updatedAt = typeof value.updatedAt === "string" ? Date.parse(value.updatedAt) : Number.NaN;
    const choiceIsValid = value.choice === "accepted" || value.choice === "rejected";
    const isCurrent = value.version === STORAGE_VERSION;
    const isFresh = Number.isFinite(updatedAt) && Date.now() - updatedAt < CONSENT_LIFETIME_MS;

    if (choiceIsValid && isCurrent && isFresh) return value as StoredConsent;

    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  } catch {
    return null;
  }
}

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(readStoredConsent() === null);
  }, []);

  function saveChoice(choice: ConsentChoice) {
    const value: StoredConsent = {
      choice,
      updatedAt: new Date().toISOString(),
      version: STORAGE_VERSION,
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // Баннер всё равно закрывается в текущей вкладке, если хранилище недоступно.
    } finally {
      setIsVisible(false);
    }
  }

  if (!isVisible) return null;

  return (
    <aside className="cookie-banner" aria-label="Настройки файлов cookie">
      <p>
        Сайт использует файлы cookie и локальное хранилище браузера для корректной работы сайта и
        форм. <a href="/cookie-policy">Подробнее</a>
      </p>
      <div className="cookie-banner-actions">
        <button className="cookie-button cookie-button-secondary" type="button" onClick={() => saveChoice("rejected")}>
          Отклонить
        </button>
        <button className="cookie-button cookie-button-primary" type="button" onClick={() => saveChoice("accepted")}>
          Принять
        </button>
      </div>
    </aside>
  );
}
