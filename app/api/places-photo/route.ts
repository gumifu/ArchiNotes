import { fetchPlacePhotoUrlFromGoogle } from "@/lib/places-photo";
import { NextResponse } from "next/server";

/**
 * GET /api/places-photo?lat=&lng=&name=
 * Places API で最寄りの施設を検索し、先頭写真の URL を返す。
 * `debug` に Google の status / error_message を含め、切り分けしやすくする（API キーは含めない）。
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const name = searchParams.get("name")?.trim();

  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { url: null, error: "invalid_params" },
      { status: 400 },
    );
  }

  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY?.trim() ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json({
      url: null,
      error: "no_api_key",
      debug: {
        reason: "set_GOOGLE_MAPS_API_KEY_or_NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
      },
    });
  }

  try {
    const result = await fetchPlacePhotoUrlFromGoogle(lat, lng, name, apiKey);
    return NextResponse.json({
      url: result.url,
      debug: result.debug,
    });
  } catch {
    return NextResponse.json({
      url: null,
      error: "fetch_failed",
      debug: { reason: "server_fetch_threw" },
    });
  }
}
