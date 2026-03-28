/**
 * AI 補完の出典・フラグ（Firestore `aiMeta` と対応。style / tags は将来拡張用）
 */
export type AiMeta = {
  isAiSuggested: boolean;
  sourceName?: string | null;
  sourceUrl?: string | null;
  note?: string | null;
};

/** フィールドキーごとの AI メタ。summary は概要（LocalizedText）用 */
export type BuildingAiMeta = {
  /** 英語名など（MVP の name_en） */
  nameEn?: AiMeta;
  architectName?: AiMeta;
  /** 完成年（Building.yearCompleted に対応） */
  year?: AiMeta;
  summary?: AiMeta;
  style?: AiMeta;
  tags?: AiMeta;
};
