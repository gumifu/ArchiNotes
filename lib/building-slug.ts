/** Firestore ドキュメント ID 形式の UUID（v1–v5） */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidLike(s: string): boolean {
  return UUID_RE.test(s.trim());
}

/** URL 用 slug: 小文字英数字とハイフン（先頭・末尾ハイフンなし） */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlugFormat(s: string): boolean {
  return s.length > 0 && s.length <= 200 && SLUG_PATTERN.test(s);
}

/**
 * 表示名から英語ベースの slug 候補を生成する。
 * 空に近い結果は `building` にフォールバックする。
 */
export function createSlugFromText(text: string): string {
  const s = text
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "building";
}

export function generateBuildingSlugCandidate(name: {
  en?: string;
  ja?: string;
}): string {
  const raw = (name.en ?? "").trim() || (name.ja ?? "").trim();
  return createSlugFromText(raw);
}
