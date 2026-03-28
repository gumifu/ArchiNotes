import {
  DEFAULT_LOCALE,
  getClientLocale,
  type LocaleCode,
} from "@/lib/locale-text";

const STORAGE_KEY = "archinotes-ui-locale";

/** 同一タブで即反映するためのカスタムイベント */
export const UI_LOCALE_CHANGE_EVENT = "archinotes-ui-locale-change";

export function getStoredUiLocale(): LocaleCode | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "ja" || v === "en") return v;
    return null;
  } catch {
    return null;
  }
}

/**
 * 保存された UI 言語があればそれを、なければブラウザ言語に合わせる。
 * SSR では DEFAULT_LOCALE（呼び出し側でガードすること）。
 */
export function readUiLocale(): LocaleCode {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = getStoredUiLocale();
  if (stored) return stored;
  return getClientLocale();
}

export function setUiLocalePreference(locale: LocaleCode): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
    window.dispatchEvent(new CustomEvent(UI_LOCALE_CHANGE_EVENT));
  } catch {
    /* quota / private mode */
  }
}

export function subscribeUiLocale(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) callback();
  };
  const onCustom = () => callback();
  window.addEventListener("storage", onStorage);
  window.addEventListener(UI_LOCALE_CHANGE_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(UI_LOCALE_CHANGE_EVENT, onCustom);
  };
}
