"use client";

import { Button } from "@/components/ui/button";
import { useUiLocale } from "@/hooks/use-ui-locale";
import type { LocaleCode } from "@/lib/locale-text";
import { setUiLocalePreference } from "@/lib/ui-locale-preference";
import Link from "next/link";
import { useCallback } from "react";

const copy = {
  ja: {
    title: "設定",
    back: "マップに戻る",
    sectionDesc:
      "建築名・住所・概要などの表示で、先に使う言語を選びます。もう一方の言語にしかない場合は、そちらを表示します。",
    jaLabel: "日本語を優先",
    enLabel: "英語を優先",
  },
  en: {
    title: "Settings",
    back: "Back to map",
    sectionDesc:
      "Choose which language appears first for names, addresses, and summaries. If a field exists only in the other language, that text is shown.",
    jaLabel: "Prioritize Japanese",
    enLabel: "Prioritize English",
  },
} as const;

export function SettingsPageClient() {
  const ui = useUiLocale();
  const t = copy[ui];

  const select = useCallback((locale: LocaleCode) => {
    setUiLocalePreference(locale);
  }, []);

  return (
    <div className="py-8">
      <div className="archinotes-max-w-form space-y-8">
        <Button variant="ghost" size="sm" className="shadow-none" asChild>
          <Link href="/">{t.back}</Link>
        </Button>

        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            {t.title}
          </h1>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            {t.sectionDesc}
          </p>
        </div>

        <ul className="space-y-3">
          <li>
            <Button
              type="button"
              variant={ui === "ja" ? "default" : "outline"}
              className="h-auto min-h-11 w-full justify-start py-3 text-left whitespace-normal"
              onClick={() => select("ja")}
            >
              {t.jaLabel}
            </Button>
          </li>
          <li>
            <Button
              type="button"
              variant={ui === "en" ? "default" : "outline"}
              className="h-auto min-h-11 w-full justify-start py-3 text-left whitespace-normal"
              onClick={() => select("en")}
            >
              {t.enLabel}
            </Button>
          </li>
        </ul>
      </div>
    </div>
  );
}
