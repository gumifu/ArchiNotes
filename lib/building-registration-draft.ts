/** 新規登録フォームの下書き（localStorage） */

import { parseBuildingAiMeta } from "@/lib/building-ai-meta";
import type { BuildingAiMeta } from "@/types/building-ai-meta";

const DRAFT_KEY_V1 = "archinotes_building_registration_draft_v1";

export const BUILDING_REGISTRATION_DRAFT_KEY =
  "archinotes_building_registration_draft_v2";

export type BuildingRegistrationDraft = {
  name_ja: string;
  name_en: string;
  address_ja: string;
  address_en: string;
  lat: string;
  lng: string;
  architect_ja: string;
  architect_en: string;
  year: string;
  summary_ja: string;
  summary_en: string;
  cover_image: string;
  gallery_urls: string[];
  place_id: string;
  /** AI 下書きで付いたメタ（任意） */
  aiMeta?: BuildingAiMeta;
};

function clampGallery(urls: unknown, max: number): string[] {
  if (!Array.isArray(urls)) return [];
  return urls
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .slice(0, max);
}

function migrateV1(d: Record<string, unknown>): BuildingRegistrationDraft {
  const addr = typeof d.address === "string" ? d.address : "";
  const desc = typeof d.description === "string" ? d.description : "";
  return {
    name_ja: typeof d.name === "string" ? d.name : "",
    name_en: typeof d.name_en === "string" ? d.name_en : "",
    address_ja: addr,
    address_en: addr,
    lat: typeof d.lat === "string" ? d.lat : "",
    lng: typeof d.lng === "string" ? d.lng : "",
    architect_ja:
      typeof d.architect_name === "string" ? d.architect_name : "",
    architect_en:
      typeof d.architect_name === "string" ? d.architect_name : "",
    year: typeof d.year === "string" ? d.year : "",
    summary_ja: desc,
    summary_en: desc,
    cover_image: typeof d.cover_image === "string" ? d.cover_image : "",
    gallery_urls: clampGallery(d.gallery_urls, 99),
    place_id: typeof d.place_id === "string" ? d.place_id : "",
    aiMeta: parseBuildingAiMeta(d.aiMeta),
  };
}

export function loadBuildingRegistrationDraft(
  maxGallery: number,
): BuildingRegistrationDraft | null {
  if (typeof window === "undefined") return null;
  try {
    let raw = localStorage.getItem(BUILDING_REGISTRATION_DRAFT_KEY);
    if (!raw) {
      const legacy = localStorage.getItem(DRAFT_KEY_V1);
      if (!legacy) return null;
      const o = JSON.parse(legacy) as unknown;
      if (!o || typeof o !== "object") return null;
      const migrated = migrateV1(o as Record<string, unknown>);
      return {
        ...migrated,
        gallery_urls: clampGallery(migrated.gallery_urls, maxGallery),
      };
    }
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== "object") return null;
    const d = o as Record<string, unknown>;
    return {
      name_ja: typeof d.name_ja === "string" ? d.name_ja : "",
      name_en: typeof d.name_en === "string" ? d.name_en : "",
      address_ja: typeof d.address_ja === "string" ? d.address_ja : "",
      address_en: typeof d.address_en === "string" ? d.address_en : "",
      lat: typeof d.lat === "string" ? d.lat : "",
      lng: typeof d.lng === "string" ? d.lng : "",
      architect_ja:
        typeof d.architect_ja === "string" ? d.architect_ja : "",
      architect_en:
        typeof d.architect_en === "string" ? d.architect_en : "",
      year: typeof d.year === "string" ? d.year : "",
      summary_ja: typeof d.summary_ja === "string" ? d.summary_ja : "",
      summary_en: typeof d.summary_en === "string" ? d.summary_en : "",
      cover_image: typeof d.cover_image === "string" ? d.cover_image : "",
      gallery_urls: clampGallery(d.gallery_urls, maxGallery),
      place_id: typeof d.place_id === "string" ? d.place_id : "",
      aiMeta: parseBuildingAiMeta(d.aiMeta),
    };
  } catch {
    return null;
  }
}

export function saveBuildingRegistrationDraft(
  draft: BuildingRegistrationDraft,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      BUILDING_REGISTRATION_DRAFT_KEY,
      JSON.stringify(draft),
    );
  } catch {
    // quota / private mode
  }
}

export function clearBuildingRegistrationDraft(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(BUILDING_REGISTRATION_DRAFT_KEY);
    localStorage.removeItem(DRAFT_KEY_V1);
  } catch {
    /* ignore */
  }
}
