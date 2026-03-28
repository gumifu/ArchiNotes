import type { Building } from "@/types/building";

/** MVP: 通常建築の Place 関連「確認」間隔（日） */
export const PLACE_INFO_REFRESH_DAYS_DEFAULT = 120;

/** MVP: 人気建築の Place 関連「確認」間隔（日） */
export const PLACE_INFO_REFRESH_DAYS_POPULAR = 45;

/**
 * `popularityScore` がこの値以上なら人気扱い（`featured` も人気）。
 * 運用で調整可。
 */
export const PLACE_INFO_POPULAR_SCORE_THRESHOLD = 30;

export type PlaceInfoVerificationSource =
  | "scheduled"
  | "manual"
  | "user_report"
  | "admin"
  | "featured";

export function isPopularForPlaceInfoRefresh(building: Building): boolean {
  if (building.featured) return true;
  return (building.popularityScore ?? 0) >= PLACE_INFO_POPULAR_SCORE_THRESHOLD;
}

export function getPlaceInfoRefreshIntervalDays(building: Building): number {
  return isPopularForPlaceInfoRefresh(building)
    ? PLACE_INFO_REFRESH_DAYS_POPULAR
    : PLACE_INFO_REFRESH_DAYS_DEFAULT;
}

/**
 * 自動更新ジョブ・一覧表示用。`placeInfoVerifiedAt` が無い、または間隔を超えていれば true。
 */
export function isPlaceInfoStale(
  building: Building,
  nowMs: number = Date.now(),
): boolean {
  const raw = building.placeInfoVerifiedAt?.trim();
  if (!raw) return true;
  const verified = Date.parse(raw);
  if (Number.isNaN(verified)) return true;
  const days = getPlaceInfoRefreshIntervalDays(building);
  return nowMs - verified >= days * 24 * 60 * 60 * 1000;
}

/** UI 用「情報確認日：YYYY-MM-DD」。未設定は em dash。 */
export function formatPlaceInfoVerifiedDateLine(
  iso: string | undefined,
): string {
  const s = iso?.trim();
  if (!s) return "情報確認日：—";
  const d = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return `情報確認日：${d}`;
  try {
    const t = Date.parse(s);
    if (Number.isNaN(t)) return "情報確認日：—";
    return `情報確認日：${new Date(t).toISOString().slice(0, 10)}`;
  } catch {
    return "情報確認日：—";
  }
}
