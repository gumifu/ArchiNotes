"use client";

import { useUiLocale } from "@/hooks/use-ui-locale";
import { useEffect } from "react";

/** `<html lang>` を UI ロケールに合わせる */
export function DocumentLangSync() {
  const locale = useUiLocale();
  useEffect(() => {
    document.documentElement.lang = locale === "en" ? "en" : "ja";
  }, [locale]);
  return null;
}
