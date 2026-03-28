import type { AiMeta, BuildingAiMeta } from "@/types/building-ai-meta";

const FIELD_KEYS = [
  "nameEn",
  "architectName",
  "year",
  "summary",
  "style",
  "tags",
] as const;

/** AI 下書き API で埋めた項目に付ける出典ラベル */
export const AI_DRAFT_SOURCE_NAME = "AI下書き";

export function createAiDraftMeta(): AiMeta {
  return {
    isAiSuggested: true,
    sourceName: AI_DRAFT_SOURCE_NAME,
    sourceUrl: null,
    note: null,
  };
}

/** Firestore 保存用: 空のキーを除く */
export function pruneBuildingAiMeta(
  meta: BuildingAiMeta | undefined | null,
): BuildingAiMeta | undefined {
  if (!meta || typeof meta !== "object") return undefined;
  const out: BuildingAiMeta = {};
  for (const key of FIELD_KEYS) {
    const m = meta[key as keyof BuildingAiMeta];
    if (m && m.isAiSuggested === true) {
      (out as Record<string, AiMeta>)[key] = m;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function parseAiMetaEntry(raw: unknown): AiMeta | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.isAiSuggested !== true) return null;
  const sourceName =
    typeof o.sourceName === "string"
      ? o.sourceName
      : typeof o.source_name === "string"
        ? o.source_name
        : null;
  const sourceUrl =
    typeof o.sourceUrl === "string"
      ? o.sourceUrl
      : typeof o.source_url === "string"
        ? o.source_url
        : null;
  const note = typeof o.note === "string" ? o.note : null;
  return {
    isAiSuggested: true,
    sourceName: sourceName?.trim() || null,
    sourceUrl: sourceUrl?.trim() || null,
    note: note?.trim() || null,
  };
}

/** Firestore / JSON の `aiMeta` を Building 用に正規化 */
export function parseBuildingAiMeta(raw: unknown): BuildingAiMeta | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const src = raw as Record<string, unknown>;
  const out: BuildingAiMeta = {};
  for (const key of FIELD_KEYS) {
    const meta = parseAiMetaEntry(src[key]);
    if (meta) {
      (out as Record<string, AiMeta>)[key] = meta;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}
