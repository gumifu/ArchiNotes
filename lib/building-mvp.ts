import {
  parseBuildingAiMeta,
  pruneBuildingAiMeta,
} from "@/lib/building-ai-meta";
import { isValidSlugFormat } from "@/lib/building-slug";
import {
  computeLocaleValidation,
  normalizeLocalizedText,
} from "@/lib/locale-text";
import type { BuildingAiMeta } from "@/types/building-ai-meta";
import type {
  Building,
  BuildingRawSource,
  LocalizedText,
} from "@/types/building";
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

function toDateString(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value) {
    const d = (value as { toDate: () => Date }).toDate();
    return d.toISOString();
  }
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function trim(s: unknown): string {
  return typeof s === "string" ? s.trim() : "";
}

function localizedFromUnknown(
  value: unknown,
): LocalizedText | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  const o = value as Record<string, unknown>;
  const ja = trim(o.ja);
  const en = trim(o.en);
  if (!ja && !en) return undefined;
  return normalizeLocalizedText({ ja, en });
}

function migrateName(data: Record<string, unknown>): LocalizedText {
  const fromMap = localizedFromUnknown(data.name);
  if (fromMap && (fromMap.ja || fromMap.en)) {
    return normalizeLocalizedText(fromMap);
  }

  const nameEnRaw =
    trim(data.name_en) ||
    trim(data.nameEn);
  const rawName = trim(data.name);
  const nameJa = trim(data.nameJa);

  if (nameEnRaw) {
    return normalizeLocalizedText({
      ja: rawName || nameJa || "",
      en: nameEnRaw,
    });
  }
  const single = rawName || nameJa;
  return normalizeLocalizedText({ ja: single, en: single });
}

function migrateArchitectName(data: Record<string, unknown>): LocalizedText | undefined {
  const fromMap = localizedFromUnknown(data.architectName);
  if (fromMap && (fromMap.ja || fromMap.en)) return normalizeLocalizedText(fromMap);

  const legacy =
    trim(data.architect_name) ||
    trim(data.architect) ||
    "";
  if (!legacy) return undefined;
  return normalizeLocalizedText({ ja: legacy, en: legacy });
}

function migrateAddress(data: Record<string, unknown>): LocalizedText | undefined {
  const fromMap = localizedFromUnknown(data.address);
  if (fromMap && (fromMap.ja || fromMap.en)) return normalizeLocalizedText(fromMap);

  const legacy = trim(data.address);
  if (!legacy) return undefined;
  return normalizeLocalizedText({ ja: legacy, en: legacy });
}

function migrateSummary(data: Record<string, unknown>): LocalizedText | undefined {
  const fromMap = localizedFromUnknown(data.summary);
  if (fromMap && (fromMap.ja || fromMap.en)) return normalizeLocalizedText(fromMap);

  const short = trim(data.shortDescription);
  const long = trim(data.description);
  if (!short && !long) return undefined;
  return normalizeLocalizedText({
    ja: short || long || "",
    en: long || short || "",
  });
}

function parseRawSource(data: Record<string, unknown>): BuildingRawSource | undefined {
  const rs = data.rawSource;
  if (!rs || typeof rs !== "object" || Array.isArray(rs)) return undefined;
  const gp = (rs as { googlePlaces?: unknown }).googlePlaces;
  if (gp === null) return { googlePlaces: null };
  if (gp && typeof gp === "object" && !Array.isArray(gp)) {
    return { googlePlaces: gp as Record<string, unknown> };
  }
  return undefined;
}

export type BuildingMvpCreateBody = {
  name: LocalizedText;
  address: LocalizedText;
  /** 省略時はサーバーが name から生成 */
  slug?: string;
  summary?: LocalizedText;
  architectName?: LocalizedText;
  lat: number;
  lng: number;
  place_id?: string;
  year?: number | null;
  cover_image?: string;
  /** カバー以外の画像 URL（最大 MVP_GALLERY_MAX_EXTRA） */
  gallery_urls?: string[];
  metadata?: Record<string, unknown>;
  /** null は Firestore で aiMeta をクリアする場合に使用 */
  aiMeta?: BuildingAiMeta | null;
  rawSource?: BuildingRawSource;
};

/**
 * Firestore `buildings` のドキュメントを `Building` に変換する。
 * 新スキーマ（LocalizedText）と従来のフラット／name_en 形式の両方に対応。
 */
export function firestoreDataToBuilding(id: string, data: DocumentData): Building {
  const d = data as Record<string, unknown>;

  const name = migrateName(d);
  const architectName = migrateArchitectName(d);
  const address = migrateAddress(d);
  const summary = migrateSummary(d);

  let location: { lat: number; lng: number };
  if (
    typeof d.lat === "number" &&
    typeof d.lng === "number" &&
    Number.isFinite(d.lat) &&
    Number.isFinite(d.lng)
  ) {
    location = { lat: d.lat, lng: d.lng };
  } else if (
    d.location &&
    typeof d.location === "object" &&
    typeof (d.location as { lat?: number }).lat === "number" &&
    typeof (d.location as { lng?: number }).lng === "number"
  ) {
    location = {
      lat: (d.location as { lat: number }).lat,
      lng: (d.location as { lng: number }).lng,
    };
  } else {
    location = { lat: 0, lng: 0 };
  }

  const googlePlaceId =
    trim(d.place_id) ||
    trim(d.googlePlaceId);

  const coverImageUrl =
    trim(d.cover_image) ||
    trim(d.coverImageUrl);

  const yearCompleted =
    typeof d.year === "number"
      ? d.year
      : typeof d.yearCompleted === "number"
        ? d.yearCompleted
        : null;

  const metadata =
    d.metadata &&
    typeof d.metadata === "object" &&
    !Array.isArray(d.metadata)
      ? (d.metadata as Record<string, unknown>)
      : undefined;

  let gallery: string[] | undefined;
  if (Array.isArray(d.gallery)) {
    const g = d.gallery
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, MVP_GALLERY_MAX_EXTRA);
    gallery = g.length > 0 ? g : undefined;
  }

  const rawSource = parseRawSource(d);

  const slugField =
    typeof d.slug === "string" && d.slug.trim() ? d.slug.trim() : "";

  const numOr0 = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

  const base: Building = {
    id,
    slug: slugField || id,
    name,
    architectId: typeof d.architectId === "string" ? d.architectId : "",
    architectName,
    yearCompleted,
    status: d.status as Building["status"],
    country: typeof d.country === "string" ? d.country : "",
    city: typeof d.city === "string" ? d.city : "",
    ward: typeof d.ward === "string" ? d.ward : undefined,
    district: typeof d.district === "string" ? d.district : undefined,
    address,
    location,
    geoPointSource: typeof d.geoPointSource === "string" ? d.geoPointSource : undefined,
    coverImageUrl,
    gallery,
    buildingType: typeof d.buildingType === "string" ? d.buildingType : undefined,
    style: typeof d.style === "string" ? d.style : undefined,
    structure: typeof d.structure === "string" ? d.structure : undefined,
    materials: Array.isArray(d.materials)
      ? d.materials.filter((x): x is string => typeof x === "string")
      : undefined,
    floorsAboveGround:
      typeof d.floorsAboveGround === "number" ? d.floorsAboveGround : null,
    floorsBelowGround:
      typeof d.floorsBelowGround === "number" ? d.floorsBelowGround : null,
    siteAreaSqm: typeof d.siteAreaSqm === "number" ? d.siteAreaSqm : null,
    floorAreaSqm: typeof d.floorAreaSqm === "number" ? d.floorAreaSqm : null,
    summary,
    historicalContext:
      typeof d.historicalContext === "string" ? d.historicalContext : undefined,
    designHighlights: Array.isArray(d.designHighlights)
      ? d.designHighlights.filter((x): x is string => typeof x === "string")
      : undefined,
    experienceTags: Array.isArray(d.experienceTags)
      ? d.experienceTags.filter((x): x is string => typeof x === "string")
      : undefined,
    styleTags: Array.isArray(d.styleTags)
      ? d.styleTags.filter((x): x is string => typeof x === "string")
      : undefined,
    visitTips: Array.isArray(d.visitTips)
      ? d.visitTips.filter((x): x is string => typeof x === "string")
      : undefined,
    nearestStation:
      typeof d.nearestStation === "string" ? d.nearestStation : undefined,
    officialWebsite:
      typeof d.officialWebsite === "string" ? d.officialWebsite : undefined,
    googleMapsUrl:
      typeof d.googleMapsUrl === "string" ? d.googleMapsUrl : undefined,
    googlePlaceId: googlePlaceId || undefined,
    placeInfoVerifiedAt:
      typeof d.placeInfoVerifiedAt === "string"
        ? d.placeInfoVerifiedAt
        : undefined,
    placeInfoVerificationSource:
      typeof d.placeInfoVerificationSource === "string"
        ? d.placeInfoVerificationSource
        : undefined,
    viewCount: numOr0(d.viewCount),
    pinClickCount: numOr0(d.pinClickCount),
    saveCount: numOr0(d.saveCount),
    journalCount: numOr0(d.journalCount),
    searchHitCount: numOr0(d.searchHitCount),
    popularityScore: numOr0(d.popularityScore),
    published: Boolean(d.published),
    featured: Boolean(d.featured),
    createdAt: toDateString(d.created_at ?? d.createdAt),
    updatedAt: toDateString(d.updated_at ?? d.updatedAt),
    metadata,
    aiMeta: parseBuildingAiMeta(d.aiMeta ?? d.ai_meta),
    rawSource,
    localeValidation: computeLocaleValidation({
      name,
      address,
      summary,
      architectName,
    }),
  };

  return base;
}

function parseLocalizedBody(
  o: Record<string, unknown>,
  key: string,
  required: boolean,
):
  | { ok: true; value: LocalizedText }
  | { ok: false; error: string } {
  const v = o[key];
  if (v === undefined || v === null) {
    if (required) return { ok: false, error: `${key} は必須です` };
    return { ok: true, value: {} };
  }
  if (typeof v === "string") {
    const t = v.trim();
    return { ok: true, value: t ? { ja: t } : {} };
  }
  if (typeof v !== "object" || Array.isArray(v)) {
    return { ok: false, error: `${key} は { ja, en } オブジェクトまたは文字列にしてください` };
  }
  const m = v as Record<string, unknown>;
  const ja = typeof m.ja === "string" ? m.ja.trim() : "";
  const en = typeof m.en === "string" ? m.en.trim() : "";
  return { ok: true, value: normalizeLocalizedText({ ja, en }) };
}

function parseOptionalLocalized(
  o: Record<string, unknown>,
  key: string,
):
  | { ok: true; value: LocalizedText | undefined }
  | { ok: false; error: string } {
  if (o[key] === undefined || o[key] === null) {
    return { ok: true, value: undefined };
  }
  const r = parseLocalizedBody(o, key, false);
  if (!r.ok) return r;
  const n = normalizeLocalizedText(r.value);
  if (!n.ja && !n.en) return { ok: true, value: undefined };
  return { ok: true, value: n };
}

/**
 * リクエスト JSON を MVP 作成用ボディにパースする。
 * 新形式（name がオブジェクト）を推奨。従来の name 文字列 + name_en も受理する。
 */
export function parseCreateBody(
  json: unknown,
):
  | { ok: true; value: BuildingMvpCreateBody }
  | { ok: false; error: string } {
  if (!json || typeof json !== "object") {
    return { ok: false, error: "Invalid JSON" };
  }
  const o = json as Record<string, unknown>;

  let name: LocalizedText;
  if (typeof o.name === "string") {
    const n = o.name.trim();
    if (!n) return { ok: false, error: "name は必須です" };
    const en =
      typeof o.name_en === "string"
        ? o.name_en.trim()
        : typeof o.nameEn === "string"
          ? o.nameEn.trim()
          : "";
    name = normalizeLocalizedText({ ja: n, en: en || undefined });
  } else {
    const pr = parseLocalizedBody(o, "name", true);
    if (!pr.ok) return pr;
    name = normalizeLocalizedText(pr.value);
    if (!name.ja && !name.en) {
      return { ok: false, error: "name.ja または name.en のいずれかが必要です" };
    }
  }

  let slug: string | undefined;
  if (o.slug !== undefined && o.slug !== null && o.slug !== "") {
    if (typeof o.slug !== "string") {
      return { ok: false, error: "slug は文字列にしてください" };
    }
    const s = o.slug.trim().toLowerCase();
    if (!isValidSlugFormat(s)) {
      return {
        ok: false,
        error:
          "slug は小文字英数字とハイフンのみ、先頭末尾にハイフンは使えません（最大200文字）",
      };
    }
    slug = s;
  }

  const lat = typeof o.lat === "number" ? o.lat : Number(o.lat);
  const lng = typeof o.lng === "number" ? o.lng : Number(o.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, error: "lat / lng が不正です" };
  }

  let address: LocalizedText;
  if (o.address === undefined || o.address === null) {
    address = {};
  } else if (typeof o.address === "string") {
    const a = o.address.trim();
    address = a ? normalizeLocalizedText({ ja: a, en: a }) : {};
  } else {
    const ar = parseLocalizedBody(o, "address", false);
    if (!ar.ok) return ar;
    address = normalizeLocalizedText(ar.value);
  }

  const summaryR = parseOptionalLocalized(o, "summary");
  if (!summaryR.ok) return summaryR;
  let summary = summaryR.value;
  if (!summary && typeof o.description === "string" && o.description.trim()) {
    const d = o.description.trim();
    summary = normalizeLocalizedText({ ja: d, en: d });
  }

  let arch: LocalizedText | undefined;
  if (typeof o.architectName === "string") {
    const t = o.architectName.trim();
    if (t) arch = normalizeLocalizedText({ ja: t, en: t });
  } else {
    const architectName = parseOptionalLocalized(o, "architectName");
    if (!architectName.ok) return architectName;
    arch = architectName.value;
  }
  if (
    !arch &&
    typeof o.architect_name === "string" &&
    o.architect_name.trim()
  ) {
    const t = o.architect_name.trim();
    arch = normalizeLocalizedText({ ja: t, en: t });
  }

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

  let aiMeta: BuildingAiMeta | null | undefined;
  if (o.aiMeta === null || o.ai_meta === null) {
    aiMeta = null;
  } else if (o.aiMeta !== undefined || o.ai_meta !== undefined) {
    aiMeta = parseBuildingAiMeta(o.aiMeta ?? o.ai_meta);
  }

  let rawSource: BuildingRawSource | undefined;
  if (o.rawSource !== undefined && o.rawSource !== null) {
    if (typeof o.rawSource !== "object" || Array.isArray(o.rawSource)) {
      return { ok: false, error: "rawSource はオブジェクトにしてください" };
    }
    const rs = o.rawSource as Record<string, unknown>;
    const gp = rs.googlePlaces;
    if (
      gp !== undefined &&
      gp !== null &&
      (typeof gp !== "object" || Array.isArray(gp))
    ) {
      return { ok: false, error: "rawSource.googlePlaces の形式が不正です" };
    }
    rawSource = {
      ...(gp !== undefined ? { googlePlaces: gp === null ? null : (gp as Record<string, unknown>) } : {}),
    };
  }

  return {
    ok: true,
    value: {
      name,
      address,
      slug,
      summary,
      architectName: arch,
      lat,
      lng,
      place_id:
        typeof o.place_id === "string"
          ? o.place_id
          : typeof o.googlePlaceId === "string"
            ? o.googlePlaceId
            : undefined,
      year: year ?? null,
      cover_image: coverTrim || undefined,
      gallery_urls,
      metadata,
      aiMeta,
      rawSource,
    },
  };
}

export function buildFirestoreWritePayload(
  body: BuildingMvpCreateBody,
): Record<string, unknown> {
  const extras = (body.gallery_urls ?? [])
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, MVP_GALLERY_MAX_EXTRA);

  const name = normalizeLocalizedText(body.name);
  const address = normalizeLocalizedText(body.address);
  const summary = body.summary
    ? normalizeLocalizedText(body.summary)
    : undefined;
  const architectName = body.architectName
    ? normalizeLocalizedText(body.architectName)
    : undefined;

  const localeValidation = computeLocaleValidation({
    name,
    address,
    summary,
    architectName,
  });

  const payload: Record<string, unknown> = {
    name,
    address,
    ...(body.slug ? { slug: body.slug } : {}),
    lat: body.lat,
    lng: body.lng,
    location: { lat: body.lat, lng: body.lng },
    place_id: body.place_id?.trim() || null,
    year: body.year ?? null,
    cover_image: body.cover_image?.trim() || null,
    gallery: extras.length > 0 ? extras : null,
    metadata: body.metadata ?? null,
    aiMeta:
      body.aiMeta === null
        ? null
        : pruneBuildingAiMeta(body.aiMeta ?? undefined) ?? null,
    published: true,
    localeValidation,
  };

  if (summary && (summary.ja || summary.en)) {
    payload.summary = summary;
  } else {
    payload.summary = null;
  }

  if (architectName && (architectName.ja || architectName.en)) {
    payload.architectName = architectName;
  } else {
    payload.architectName = null;
  }

  if (body.rawSource !== undefined) {
    payload.rawSource = body.rawSource ?? null;
  }

  return payload;
}

/** フォーム初期値用: Building → MVP 入力 */
export function buildingToMvpFormValues(building: Building) {
  const extras = (building.gallery ?? [])
    .filter(Boolean)
    .slice(0, MVP_GALLERY_MAX_EXTRA);
  return {
    name_ja: building.name.ja ?? "",
    name_en: building.name.en ?? "",
    address_ja: building.address?.ja ?? "",
    address_en: building.address?.en ?? "",
    summary_ja: building.summary?.ja ?? "",
    summary_en: building.summary?.en ?? "",
    architect_ja: building.architectName?.ja ?? "",
    architect_en: building.architectName?.en ?? "",
    lat: String(building.location.lat),
    lng: String(building.location.lng),
    year:
      building.yearCompleted != null ? String(building.yearCompleted) : "",
    cover_image: building.coverImageUrl ?? "",
    gallery_urls: extras,
    place_id: building.googlePlaceId ?? "",
  };
}
