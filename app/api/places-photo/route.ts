import {
  DEFAULT_MAX_PLACE_PHOTOS,
  fetchPlacePhotosFromGoogle,
} from "@/lib/places-photo";
import {
  getPlacesPhotoCached,
  placesPhotoCacheKey,
  placesPhotoCacheKeyByPlaceId,
  setPlacesPhotoCached,
} from "@/lib/places-photo-cache";
import { NextResponse } from "next/server";

/**
 * GET /api/places-photo?lat=&lng=&name=&max=8
 * または GET /api/places-photo?placeId=ChIJ...&max=8
 * Places API で写真 URL を複数返す（24h メモリキャッシュ）。
 * DB 永続化方針: docs/google-maps-platform-data-policy.md
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placeIdParam = searchParams.get("placeId")?.trim();
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const name = searchParams.get("name")?.trim();
  const maxRaw = Number(searchParams.get("max"));
  const max = Number.isFinite(maxRaw)
    ? Math.min(Math.max(1, maxRaw), 10)
    : DEFAULT_MAX_PLACE_PHOTOS;

  if (
    !placeIdParam &&
    (!name || !Number.isFinite(lat) || !Number.isFinite(lng))
  ) {
    return NextResponse.json(
      { url: null, urls: [], error: "invalid_params" },
      { status: 400 },
    );
  }

  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY?.trim() ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json({
      url: null,
      urls: [],
      error: "no_api_key",
      debug: {
        reason: "set_GOOGLE_MAPS_API_KEY_or_NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
      },
    });
  }

  const cacheKey = placeIdParam
    ? placesPhotoCacheKeyByPlaceId(placeIdParam, max)
    : placesPhotoCacheKey(lat, lng, name!, max);

  const cached = getPlacesPhotoCached(cacheKey);
  if (cached) {
    return NextResponse.json({
      url: cached.url,
      urls: cached.urls,
      debug: cached.debug,
      cached: true,
    });
  }

  try {
    const result = await fetchPlacePhotosFromGoogle(
      lat,
      lng,
      name ?? "",
      apiKey,
      max,
      placeIdParam ? { placeId: placeIdParam } : undefined,
    );
    if (result.url || result.urls.length > 0) {
      setPlacesPhotoCached(cacheKey, result);
    }
    return NextResponse.json({
      url: result.url,
      urls: result.urls,
      debug: result.debug,
      cached: false,
    });
  } catch {
    return NextResponse.json({
      url: null,
      urls: [],
      error: "fetch_failed",
      debug: { reason: "server_fetch_threw" },
    });
  }
}
