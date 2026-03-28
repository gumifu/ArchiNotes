import { fetchPlaceMvpPrefill } from "@/lib/places-prefill";
import { NextResponse } from "next/server";

/**
 * GET /api/places-prefill?placeId=...
 * 新規建築フォーム初期値用。Places を ja / en で取得し名称・住所を両言語に分ける。
 * rawSource.googlePlaces は { ja, en } に各レスポンスを格納。
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
