import type { Building } from "@/types/building";
import type { DocumentData } from "firebase/firestore";

/** カバー1 + 追加最大14 = 合計15枚まで */
export const MVP_GALLERY_MAX_EXTRA = 14;

function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export type BuildingMvpCreateBody = {
  name: string;
  name_en?: string;
  lat: number;
  lng: number;
  address: string;
  place_id?: string;
  architect_name?: string;
  year?: number | null;
  description?: string;
  cover_image?: string;
  /** カバー以外の画像 URL（最大 MVP_GALLERY_MAX_EXTRA） */
  gallery_urls?: string[];
  metadata?: Record<string, unknown>;
};

function toDateString(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value) {
    const d = (value as { toDate: () => Date }).toDate();
    return d.toISOString();
  }
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

/**
 * Firestore `buildings` のドキュメントを `Building` に変換する。
 * MVP フィールド（name_en, lat/lng, architect_name 等）と既存 camelCase ドキュメントの両方に対応。
 */
export function firestoreDataToBuilding(id: string, data: DocumentData): Building {
  const nameEnRaw =
    typeof data.name_en === "string"
      ? data.name_en.trim()
      : typeof data.nameEn === "string"
        ? data.nameEn.trim()
        : "";
  const rawName = typeof data.name === "string" ? data.name : "";

  let name: string;
  let nameJa: string | undefined;
  if (nameEnRaw) {
    name = nameEnRaw;
    nameJa = rawName || undefined;
  } else {
    name = rawName;
    nameJa = typeof data.nameJa === "string" ? data.nameJa : undefined;
  }

  let location: { lat: number; lng: number };
  if (
    typeof data.lat === "number" &&
    typeof data.lng === "number" &&
    Number.isFinite(data.lat) &&
    Number.isFinite(data.lng)
  ) {
    location = { lat: data.lat, lng: data.lng };
  } else if (
    data.location &&
    typeof data.location === "object" &&
    typeof (data.location as { lat?: number }).lat === "number" &&
    typeof (data.location as { lng?: number }).lng === "number"
  ) {
    location = {
      lat: (data.location as { lat: number }).lat,
      lng: (data.location as { lng: number }).lng,
    };
  } else {
    location = { lat: 0, lng: 0 };
  }

  const architectName =
    typeof data.architect_name === "string"
      ? data.architect_name
      : typeof data.architectName === "string"
        ? data.architectName
        : typeof data.architect === "string"
          ? data.architect
          : "";

  const googlePlaceId =
    typeof data.place_id === "string"
      ? data.place_id
      : typeof data.googlePlaceId === "string"
        ? data.googlePlaceId
        : undefined;

  const coverImageUrl =
    typeof data.cover_image === "string"
      ? data.cover_image
      : typeof data.coverImageUrl === "string"
        ? data.coverImageUrl
        : undefined;

  const yearCompleted =
    typeof data.year === "number"
      ? data.year
      : typeof data.yearCompleted === "number"
        ? data.yearCompleted
        : null;

  const metadata =
    data.metadata &&
    typeof data.metadata === "object" &&
    !Array.isArray(data.metadata)
      ? (data.metadata as Record<string, unknown>)
      : undefined;

  let gallery: string[] | undefined;
  if (Array.isArray(data.gallery)) {
    const g = data.gallery
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, MVP_GALLERY_MAX_EXTRA);
    gallery = g.length > 0 ? g : undefined;
  }

  return {
    id,
    slug: typeof data.slug === "string" && data.slug ? data.slug : id,
    name,
    nameJa,
    architectId: typeof data.architectId === "string" ? data.architectId : "",
    architectName,
    yearCompleted,
    status: data.status,
    country: typeof data.country === "string" ? data.country : "",
    city: typeof data.city === "string" ? data.city : "",
    ward: data.ward,
    district: data.district,
    address: data.address,
    location,
    geoPointSource: data.geoPointSource,
    coverImageUrl,
    gallery,
    buildingType: data.buildingType,
    style: data.style,
    structure: data.structure,
    materials: data.materials,
    floorsAboveGround: data.floorsAboveGround ?? null,
    floorsBelowGround: data.floorsBelowGround ?? null,
    siteAreaSqm: data.siteAreaSqm ?? null,
    floorAreaSqm: data.floorAreaSqm ?? null,
    description: data.description,
    shortDescription: data.shortDescription,
    historicalContext: data.historicalContext,
    designHighlights: data.designHighlights,
    experienceTags: data.experienceTags,
    styleTags: data.styleTags,
    visitTips: data.visitTips,
    nearestStation: data.nearestStation,
    officialWebsite: data.officialWebsite,
    googleMapsUrl: data.googleMapsUrl,
    googlePlaceId,
    placeInfoVerifiedAt:
      typeof data.placeInfoVerifiedAt === "string"
        ? data.placeInfoVerifiedAt
        : undefined,
    placeInfoVerificationSource:
      typeof data.placeInfoVerificationSource === "string"
        ? data.placeInfoVerificationSource
        : undefined,
    viewCount: data.viewCount ?? 0,
    pinClickCount: data.pinClickCount ?? 0,
    saveCount: data.saveCount ?? 0,
    journalCount: data.journalCount ?? 0,
    searchHitCount: data.searchHitCount ?? 0,
    popularityScore: data.popularityScore ?? 0,
    published: data.published ?? false,
    featured: Boolean(data.featured),
    createdAt: toDateString(data.created_at ?? data.createdAt),
    updatedAt: toDateString(data.updated_at ?? data.updatedAt),
    metadata,
  };
}

export function buildFirestoreWritePayload(
  body: BuildingMvpCreateBody,
): Record<string, unknown> {
  const description = body.description?.trim() ?? "";
  const extras = (body.gallery_urls ?? [])
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, MVP_GALLERY_MAX_EXTRA);
  return {
    name: body.name.trim(),
    name_en: body.name_en?.trim() || null,
    lat: body.lat,
    lng: body.lng,
    location: { lat: body.lat, lng: body.lng },
    address: body.address.trim(),
    place_id: body.place_id?.trim() || null,
    architect_name: body.architect_name?.trim() || null,
    year: body.year ?? null,
    description,
    cover_image: body.cover_image?.trim() || null,
    gallery: extras.length > 0 ? extras : null,
    metadata: body.metadata ?? null,
    published: true,
  };
}

export function parseCreateBody(
  json: unknown,
):
  | { ok: true; value: BuildingMvpCreateBody }
  | { ok: false; error: string } {
  if (!json || typeof json !== "object") {
    return { ok: false, error: "Invalid JSON" };
  }
  const o = json as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim() : "";
  if (!name) return { ok: false, error: "name は必須です" };

  const lat = typeof o.lat === "number" ? o.lat : Number(o.lat);
  const lng = typeof o.lng === "number" ? o.lng : Number(o.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, error: "lat / lng が不正です" };
  }

  const address = typeof o.address === "string" ? o.address.trim() : "";

  let year: number | null | undefined;
  if (o.year !== undefined && o.year !== null && o.year !== "") {
    const y = typeof o.year === "number" ? o.year : Number(o.year);
    if (!Number.isFinite(y)) return { ok: false, error: "year が不正です" };
    year = y;
  }

  let metadata: Record<string, unknown> | undefined;
  if (o.metadata !== undefined && o.metadata !== null) {
    if (typeof o.metadata !== "object" || Array.isArray(o.metadata)) {
      return { ok: false, error: "metadata はオブジェクトにしてください" };
    }
    metadata = o.metadata as Record<string, unknown>;
  }

  const coverTrim =
    typeof o.cover_image === "string" ? o.cover_image.trim() : "";
  if (coverTrim && !isHttpUrl(coverTrim)) {
    return {
      ok: false,
      error: "カバー画像の URL は http(s) で始まる必要があります",
    };
  }

  let gallery_urls: string[] | undefined;
  if (o.gallery_urls !== undefined && o.gallery_urls !== null) {
    if (!Array.isArray(o.gallery_urls)) {
      return { ok: false, error: "gallery_urls は配列にしてください" };
    }
    if (o.gallery_urls.length > MVP_GALLERY_MAX_EXTRA) {
      return {
        ok: false,
        error: `追加画像は最大 ${MVP_GALLERY_MAX_EXTRA} 枚です`,
      };
    }
    const urls: string[] = [];
    for (const item of o.gallery_urls) {
      if (typeof item !== "string") {
        return { ok: false, error: "gallery_urls の各要素は文字列にしてください" };
      }
      const t = item.trim();
      if (!t) continue;
      if (!isHttpUrl(t)) {
        return {
          ok: false,
          error: "追加画像の URL は http(s) で始まる必要があります",
        };
      }
      urls.push(t);
    }
    gallery_urls = urls;
  }

  return {
    ok: true,
    value: {
      name,
      name_en: typeof o.name_en === "string" ? o.name_en : undefined,
      lat,
      lng,
      address,
      place_id: typeof o.place_id === "string" ? o.place_id : undefined,
      architect_name:
        typeof o.architect_name === "string" ? o.architect_name : undefined,
      year: year ?? null,
      description:
        typeof o.description === "string" ? o.description : undefined,
      cover_image: coverTrim || undefined,
      gallery_urls,
      metadata,
    },
  };
}

/** フォーム初期値用: Building → MVP 入力 */
export function buildingToMvpFormValues(building: Building) {
  const extras = (building.gallery ?? []).filter(Boolean).slice(0, MVP_GALLERY_MAX_EXTRA);
  return {
    name: building.nameJa ?? building.name,
    name_en: building.nameJa ? building.name : "",
    address: building.address ?? "",
    lat: String(building.location.lat),
    lng: String(building.location.lng),
    architect_name: building.architectName ?? "",
    year:
      building.yearCompleted != null ? String(building.yearCompleted) : "",
    description: building.description ?? "",
    cover_image: building.coverImageUrl ?? "",
    gallery_urls: extras,
    place_id: building.googlePlaceId ?? "",
  };
}
