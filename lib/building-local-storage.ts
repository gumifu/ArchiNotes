import type { Building } from "@/types/building";

const STORAGE_KEY = "archinotes-building-overrides";

export const BUILDING_OVERRIDE_EVENT = "archinotes-building-override";

function readAll(): Record<string, Partial<Building>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<Building>>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * ローカル JSON / Firestore の建築データに、このブラウザで保存した上書きをマージする。
 */
export function mergeBuildingWithOverrides(building: Building): Building {
  if (typeof window === "undefined") return building;
  const all = readAll();
  const o = all[building.id];
  if (!o || typeof o !== "object") return building;
  const { location: locO, ...rest } = o;
  return {
    ...building,
    ...rest,
    location:
      locO &&
      typeof locO === "object" &&
      typeof (locO as Building["location"]).lat === "number" &&
      typeof (locO as Building["location"]).lng === "number"
        ? {
            ...building.location,
            lat: (locO as Building["location"]).lat,
            lng: (locO as Building["location"]).lng,
          }
        : building.location,
    id: building.id,
  };
}

export function saveBuildingOverride(
  buildingId: string,
  patch: Partial<Building>,
): void {
  if (typeof window === "undefined") return;
  const all = readAll();
  const prev = all[buildingId] ?? {};
  all[buildingId] = {
    ...prev,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  window.dispatchEvent(new CustomEvent(BUILDING_OVERRIDE_EVENT));
}

export function clearBuildingOverride(buildingId: string): void {
  if (typeof window === "undefined") return;
  const all = readAll();
  delete all[buildingId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  window.dispatchEvent(new CustomEvent(BUILDING_OVERRIDE_EVENT));
}
