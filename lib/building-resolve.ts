import { getBuildingById, getBuildingBySlug } from "@/lib/buildings";
import { getBuildingFromFirestoreBySlugOrId } from "@/lib/buildings-server";
import type { Building } from "@/types/building";
import { permanentRedirect } from "next/navigation";

/**
 * 建築詳細・編集ページ用: URL セグメント（slug または旧 UUID / ローカル id）から Building を解決する。
 */
export async function resolveBuildingFromUrlSegment(
  param: string,
): Promise<Building | null> {
  const trimmed = param.trim();
  if (!trimmed) return null;
  const fromDb = await getBuildingFromFirestoreBySlugOrId(trimmed);
  if (fromDb) return fromDb;
  return getBuildingBySlug(trimmed) ?? getBuildingById(trimmed);
}

/**
 * 正規 URL（slug 優先）へ 308 リダイレクト。param が既に正規なら何もしない。
 */
export function permanentRedirectToCanonicalBuildingPath(
  param: string,
  building: Building,
  options?: { suffix?: string },
): void {
  const canonical = building.slug || building.id;
  if (param === canonical) return;
  const suffix = options?.suffix ?? "";
  permanentRedirect(`/buildings/${encodeURIComponent(canonical)}${suffix}`);
}
