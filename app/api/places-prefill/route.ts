import { fetchPlaceMvpPrefill } from "@/lib/places-prefill";
import { NextResponse } from "next/server";

/**
 * GET /api/places-prefill?placeId=...
 * 新規建築フォーム初期値用。レスポンスはフォーム向け最小項目のみ（DB に Google 本文を載せない方針）。
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
    return NextResponse.json(
      { error: "no_api_key" },
      { status: 503 },
    );
  }

  try {
    const prefill = await fetchPlaceMvpPrefill(placeId, apiKey);
    return NextResponse.json(prefill);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json(
      { error: "fetch_failed", message: msg },
      { status: 502 },
    );
  }
}
