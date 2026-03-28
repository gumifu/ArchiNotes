/**
 * 建築の集計（Firestore）。未接続時は no-op。
 */

export type BuildingStatEvent =
  | "view"
  | "pin_click"
  | "save"
  | "journal"
  | "search_hit";

/**
 * 集計を 1 件加算（失敗は無視・UI をブロックしない）。
 */
export function trackBuildingStat(
  buildingId: string,
  event: BuildingStatEvent,
): void {
  if (!buildingId.trim()) return;
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) return;

  void fetch(`/api/buildings/${encodeURIComponent(buildingId)}/stats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
  }).catch(() => {
    /* ignore */
  });
}
