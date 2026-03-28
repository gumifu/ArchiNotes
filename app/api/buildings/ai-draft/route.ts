import { generateBuildingDraft } from "@/lib/ai-building-draft";
import { NextResponse } from "next/server";

/**
 * POST /api/buildings/ai-draft
 * body: { name_ja, name_en?, address_ja?, address_en?, place_id?, lat?, lng? }
 * 建築家・年・概要・英名の下書き案（推測。保存前にユーザーが確認すること）。
 */
export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "openai_not_configured",
        message:
          "OPENAI_API_KEY が未設定です。.env.local に設定すると AI 下書きが使えます。",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const nameJa = typeof o.name_ja === "string" ? o.name_ja.trim() : "";
  const nameEn = typeof o.name_en === "string" ? o.name_en.trim() : "";
  if (nameJa.length < 1 && nameEn.length < 2) {
    return NextResponse.json(
      {
        error: "name_required",
        message: "名称（日本語または英語）を入力してください。",
      },
      { status: 400 },
    );
  }

  const lat =
    typeof o.lat === "number"
      ? o.lat
      : o.lat != null
        ? Number(o.lat)
        : undefined;
  const lng =
    typeof o.lng === "number"
      ? o.lng
      : o.lng != null
        ? Number(o.lng)
        : undefined;

  const input = {
    name_ja: nameJa || nameEn,
    name_en: nameEn || undefined,
    address_ja:
      typeof o.address_ja === "string" ? o.address_ja : undefined,
    address_en:
      typeof o.address_en === "string" ? o.address_en : undefined,
    place_id: typeof o.place_id === "string" ? o.place_id : undefined,
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
  };

  try {
    const draft = await generateBuildingDraft(input, apiKey, model);
    return NextResponse.json({
      draft,
      disclaimer:
        "AI の推測です。建築家・竣工年・説明は必ずご自身で確認してから保存してください。",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown_error";
    console.error("[ai-draft]", msg);
    return NextResponse.json(
      {
        error: "draft_failed",
        message:
          "AI 下書きの取得に失敗しました。しばらくしてから再度お試しください。",
      },
      { status: 502 },
    );
  }
}
