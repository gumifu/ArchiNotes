/**
 * 建築登録フォーム用の AI 下書き（サーバーのみ）。
 * 推測であり誤りうる旨をプロンプトで明示し、JSON のみ返させる。
 */

export type BuildingDraftInput = {
  name_ja: string;
  name_en?: string;
  address_ja?: string;
  address_en?: string;
  place_id?: string;
  lat?: number;
  lng?: number;
};

export type BuildingDraftOutput = {
  architect_ja?: string | null;
  architect_en?: string | null;
  year?: number | null;
  summary_ja?: string | null;
  summary_en?: string | null;
  /** 英語固有名の補足（入力に英名がない場合のみ） */
  name_en?: string | null;
};

const SYSTEM = `あなたは建築・都市の参考情報を短く提案するアシスタントです。
出力は必ず有効な JSON オブジェクトのみ。説明文やマークダウンは禁止。
次のキーだけを使う: architect_ja, architect_en, year, summary_ja, summary_en, name_en
- architect_ja: 設計者名が分かる場合の日本語表記。不明なら null。
- architect_en: 設計者名が分かる場合の英語表記。不明なら null。
- year: 竣工年が分かる場合のみ整数。不明なら null。推測が弱い場合は null。
- summary_ja: 日本語で 1〜4 文、建築の概要。不確実な事実は書かない。「推測」「要確認」は書いてよい。
- summary_en: English, 1–4 sentences overview. null if unknown.
- name_en: 英語の固有名が分かり、入力に英名が足りない場合のみ。不明なら null。
推測に自信がない項目は null にする。ハルシネーションを避ける。`;

export async function generateBuildingDraft(
  input: BuildingDraftInput,
  apiKey: string,
  model: string,
): Promise<BuildingDraftOutput> {
  const userPayload = {
    building_name_ja: input.name_ja.trim(),
    building_name_en: input.name_en?.trim() || null,
    address_ja: input.address_ja?.trim() || null,
    address_en: input.address_en?.trim() || null,
    place_id: input.place_id?.trim() || null,
    coordinates:
      input.lat != null && input.lng != null
        ? { lat: input.lat, lng: input.lng }
        : null,
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: JSON.stringify(userPayload),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.35,
      max_tokens: 800,
    }),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`openai_http_${res.status}: ${t.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("openai_empty_content");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("openai_invalid_json");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("openai_invalid_shape");
  }

  const o = parsed as Record<string, unknown>;

  const strOrNull = (k: string) => {
    const v = o[k];
    if (typeof v === "string") return v.trim() || null;
    if (v === null) return null;
    return undefined;
  };

  const architect_ja = strOrNull("architect_ja");
  const architect_en = strOrNull("architect_en");

  let year: number | null | undefined;
  if (o.year === null) year = null;
  else if (typeof o.year === "number" && Number.isFinite(o.year))
    year = Math.round(o.year);
  else if (typeof o.year === "string") {
    const y = Number.parseInt(o.year, 10);
    year = Number.isFinite(y) ? y : null;
  }

  const summary_ja = strOrNull("summary_ja");
  const summary_en = strOrNull("summary_en");
  const name_en = strOrNull("name_en");

  return {
    architect_ja: architect_ja ?? null,
    architect_en: architect_en ?? null,
    year: year === undefined ? null : year,
    summary_ja: summary_ja ?? null,
    summary_en: summary_en ?? null,
    name_en: name_en ?? null,
  };
}
