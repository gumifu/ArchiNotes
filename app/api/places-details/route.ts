import type { LocaleCode } from "@/lib/locale-text";
import { fetchPlaceDetailsNew } from "@/lib/places-details";
import {
  getPlaceDetailsCached,
  placesDetailsCacheKey,
  setPlaceDetailsCached,
} from "@/lib/places-details-cache";
import { NextResponse } from "next/server";

function parseUiLocale(param: string | null): LocaleCode {
  const v = param?.trim().toLowerCase();
  return v === "ja" ? "ja" : "en";
}

/**
 * GET /api/places-details?placeId=ChIJ...&languageCode=ja|en
 * Places API (New) の Place Details（営業時間・カテゴリ表示名・営業状態・親施設・Maps リンク）。
 * `languageCode` は UI 言語に合わせる（未指定は `en`）。サーバ短期キャッシュは placeId×言語で分離。
 * DB 永続化方針: docs/google-maps-platform-data-policy.md
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("placeId")?.trim();
  const uiLocale = parseUiLocale(searchParams.get("languageCode"));

  if (!placeId) {
    return NextResponse.json(
      { error: "invalid_params", message: "placeId is required" },
      { status: 400 },
    );
  }

  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY?.trim() ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json({
      error: "no_api_key",
      message: "Set GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
    });
  }

  const cacheKey = placesDetailsCacheKey(placeId, uiLocale);
  const cached = getPlaceDetailsCached(cacheKey);
  if (cached) {
    return NextResponse.json({ ...cached, cached: true });
  }

  try {
    const payload = await fetchPlaceDetailsNew(placeId, apiKey, { uiLocale });
    setPlaceDetailsCached(cacheKey, payload);
    return NextResponse.json({ ...payload, cached: false });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json(
      { error: "fetch_failed", message: msg },
      { status: 502 },
    );
  }
}
