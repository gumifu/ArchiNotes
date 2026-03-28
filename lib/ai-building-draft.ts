/**
 * 建築登録フォーム用の AI 下書き（サーバーのみ）。
 * 推測であり誤りうる旨をプロンプトで明示し、JSON のみ返させる。
 */

export type BuildingDraftInput = {
  name: string;
  name_en?: string;
  address?: string;
  place_id?: string;
  lat?: number;
  lng?: number;
};

export type BuildingDraftOutput = {
  architect_name?: string | null;
  year?: number | null;
  description?: string | null;
  name_en?: string | null;
};

const SYSTEM = `あなたは建築・都市の参考情報を短く提案するアシスタントです。
出力は必ず有効な JSON オブジェクトのみ。説明文やマークダウンは禁止。
次のキーだけを使う: architect_name, year, description, name_en
- architect_name: 設計者名が分かる場合のみ。不明なら null。
- year: 竣工年が分かる場合のみ整数。不明なら null。推測が弱い場合は null。
- description: 日本語で 1〜4 文、建築の概要。不確実な事実は書かない。「推測」「要確認」は書いてよい。
- name_en: 英語の固有名が分かる場合のみ。不明なら null。
推測に自信がない項目は null にする。ハルシネーションを避ける。`;

export async function generateBuildingDraft(
  input: BuildingDraftInput,
  apiKey: string,
  model: string,
): Promise<BuildingDraftOutput> {
  const userPayload = {
    building_name_ja: input.name.trim(),
    building_name_en: input.name_en?.trim() || null,
    address: input.address?.trim() || null,
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

  const architect_name =
    typeof o.architect_name === "string"
      ? o.architect_name.trim() || null
      : o.architect_name === null
        ? null
        : undefined;

  let year: number | null | undefined;
  if (o.year === null) year = null;
  else if (typeof o.year === "number" && Number.isFinite(o.year))
    year = Math.round(o.year);
  else if (typeof o.year === "string") {
    const y = Number.parseInt(o.year, 10);
    year = Number.isFinite(y) ? y : null;
  }

  const description =
    typeof o.description === "string"
      ? o.description.trim() || null
      : o.description === null
        ? null
        : undefined;

  const name_en =
    typeof o.name_en === "string"
      ? o.name_en.trim() || null
      : o.name_en === null
        ? null
        : undefined;

  return {
    architect_name: architect_name ?? null,
    year: year === undefined ? null : year,
    description: description ?? null,
    name_en: name_en ?? null,
  };
}
