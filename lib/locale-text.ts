import type {
  Building,
  BuildingLocaleValidation,
  LocalizedText,
} from "@/types/building";

export type LocaleCode = "ja" | "en";

export const DEFAULT_LOCALE: LocaleCode = "ja";

function trim(s: string | undefined): string {
  return typeof s === "string" ? s.trim() : "";
}

/**
 * 現在ロケールを優先し、空ならもう一方にフォールバックする。
 */
export function pickLocalized(
  text: LocalizedText | undefined,
  locale: LocaleCode,
): string {
  if (!text) return "";
  const primary = trim(locale === "ja" ? text.ja : text.en);
  if (primary) return primary;
  const fallback = trim(locale === "ja" ? text.en : text.ja);
  return fallback;
}

/** ブラウザの言語設定に基づく UI ロケール（SSR では ja） */
export function getClientLocale(): LocaleCode {
  if (typeof navigator === "undefined" || !navigator.language) return "ja";
  return navigator.language.toLowerCase().startsWith("ja") ? "ja" : "en";
}

export function normalizeLocalizedText(
  input: LocalizedText | undefined,
): LocalizedText {
  if (!input) return {};
  const ja = trim(input.ja);
  const en = trim(input.en);
  return {
    ...(ja ? { ja } : {}),
    ...(en ? { en } : {}),
  };
}

export function computeLocaleValidation(input: {
  name: LocalizedText;
  address?: LocalizedText;
  summary?: LocalizedText;
  architectName?: LocalizedText;
}): BuildingLocaleValidation {
  const missingJa: string[] = [];
  const missingEn: string[] = [];

  const needBoth = (key: string, t: LocalizedText | undefined) => {
    if (!t) return;
    const hasJa = !!trim(t.ja);
    const hasEn = !!trim(t.en);
    if (hasJa && !hasEn) missingEn.push(key);
    if (hasEn && !hasJa) missingJa.push(key);
  };

  if (!trim(input.name.ja)) missingJa.push("name");
  if (!trim(input.name.en)) missingEn.push("name");

  needBoth("address", input.address);
  needBoth("summary", input.summary);
  needBoth("architectName", input.architectName);

  return {
    ...(missingJa.length > 0 ? { missingJa } : {}),
    ...(missingEn.length > 0 ? { missingEn } : {}),
  };
}

export function hasLocaleValidationIssues(v: BuildingLocaleValidation): boolean {
  return (
    (v.missingJa?.length ?? 0) > 0 || (v.missingEn?.length ?? 0) > 0
  );
}

/** 検索用に建築の両言語フィールドを連結する */
export function buildingSearchHayString(b: Building): string {
  return [
    b.name?.ja,
    b.name?.en,
    b.architectName?.ja,
    b.architectName?.en,
    b.summary?.ja,
    b.summary?.en,
    b.address?.ja,
    b.address?.en,
    b.city,
    b.country,
    b.ward,
  ]
    .filter((x): x is string => typeof x === "string" && x.length > 0)
    .join(" ");
}
