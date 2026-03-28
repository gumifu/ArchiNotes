import { fetchPlacesAutocomplete } from "@/lib/places-autocomplete";
import { NextResponse } from "next/server";

/**
 * GET /api/places-autocomplete?q=... （3文字以上）
 * Places API (New) Autocomplete。候補表示のみ。
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 3) {
    return NextResponse.json({ suggestions: [] as const });
  }

  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY?.trim() ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      { error: "no_api_key", suggestions: [] },
      { status: 503 },
    );
  }

  try {
    const suggestions = await fetchPlacesAutocomplete(q, apiKey);
    return NextResponse.json({ suggestions });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json(
      { error: "fetch_failed", message: msg, suggestions: [] },
      { status: 502 },
    );
  }
}
