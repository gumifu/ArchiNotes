/** 新規登録フォームの下書き（localStorage） */

export const BUILDING_REGISTRATION_DRAFT_KEY =
  "archinotes_building_registration_draft_v1";

export type BuildingRegistrationDraft = {
  name: string;
  name_en: string;
  address: string;
  lat: string;
  lng: string;
  architect_name: string;
  year: string;
  description: string;
  cover_image: string;
  gallery_urls: string[];
  place_id: string;
};

function clampGallery(urls: unknown, max: number): string[] {
  if (!Array.isArray(urls)) return [];
  return urls
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .slice(0, max);
}

export function loadBuildingRegistrationDraft(
  maxGallery: number,
): BuildingRegistrationDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(BUILDING_REGISTRATION_DRAFT_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== "object") return null;
    const d = o as Record<string, unknown>;
    return {
      name: typeof d.name === "string" ? d.name : "",
      name_en: typeof d.name_en === "string" ? d.name_en : "",
      address: typeof d.address === "string" ? d.address : "",
      lat: typeof d.lat === "string" ? d.lat : "",
      lng: typeof d.lng === "string" ? d.lng : "",
      architect_name:
        typeof d.architect_name === "string" ? d.architect_name : "",
      year: typeof d.year === "string" ? d.year : "",
      description: typeof d.description === "string" ? d.description : "",
      cover_image: typeof d.cover_image === "string" ? d.cover_image : "",
      gallery_urls: clampGallery(d.gallery_urls, maxGallery),
      place_id: typeof d.place_id === "string" ? d.place_id : "",
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
  } catch {
    /* ignore */
  }
}
