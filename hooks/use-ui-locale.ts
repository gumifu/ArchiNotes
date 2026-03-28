"use client";

import { DEFAULT_LOCALE, type LocaleCode } from "@/lib/locale-text";
import { readUiLocale, subscribeUiLocale } from "@/lib/ui-locale-preference";
import { useSyncExternalStore } from "react";

/**
 * アプリ全体の表示言語（設定で保存した値を最優先し、未設定時はブラウザ言語）。
 * `pickLocalized(..., locale)` と組み合わせて、日本語中心 / 英語中心の表示にする。
 */
export function useUiLocale(): LocaleCode {
  return useSyncExternalStore(
    subscribeUiLocale,
    readUiLocale,
    () => DEFAULT_LOCALE,
  );
}
