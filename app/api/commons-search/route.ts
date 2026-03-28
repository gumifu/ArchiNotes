import { searchCommonsImages } from "@/lib/commons-search";
import { NextResponse } from "next/server";

/**
 * GET /api/commons-search?q=...&limit=12
 * Wikimedia Commons の File 検索（プロキシ）。クライアントは直接 Commons を叩かない。
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json(
      { error: "q は2文字以上にしてください", results: [] },
      { status: 400 },
    );
  }

  const limit = Math.min(
    24,
    Math.max(1, Number(searchParams.get("limit")) || 12),
  );

  try {
    const results = await searchCommonsImages(q, limit);
    return NextResponse.json({ results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown_error";
    console.error("[commons-search]", e);
    return NextResponse.json(
      { error: "fetch_failed", message: msg, results: [] },
      { status: 502 },
    );
  }
}
