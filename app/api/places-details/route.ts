import { fetchPlaceDetailsNew } from "@/lib/places-details";
import {
  getPlaceDetailsCached,
  placesDetailsCacheKey,
  setPlaceDetailsCached,
} from "@/lib/places-details-cache";
import { NextResponse } from "next/server";

/**
 * GET /api/places-details?placeId=ChIJ...
 * Places API (New) の Place Details（営業時間・カテゴリ・営業状態・親施設・Maps リンク）。
 * DB 永続化方針: docs/google-maps-platform-data-policy.md
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("placeId")?.trim();

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

  const cacheKey = placesDetailsCacheKey(placeId);
  const cached = getPlaceDetailsCached(cacheKey);
  if (cached) {
    return NextResponse.json({ ...cached, cached: true });
  }

  try {
    const payload = await fetchPlaceDetailsNew(placeId, apiKey);
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
