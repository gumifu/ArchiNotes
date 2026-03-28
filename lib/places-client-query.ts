import { DEFAULT_MAX_PLACE_PHOTOS } from "@/lib/places-photo";
import { pickLocalized } from "@/lib/locale-text";
import type { Building } from "@/types/building";

/**
 * `/api/places-photo` 用クエリ文字列（place_id 固定時は Text Search を使わない）。
 */
export function buildPlacesPhotoQueryString(
  building: Building,
  max: number = DEFAULT_MAX_PLACE_PHOTOS,
): string {
  const cap = Math.min(Math.max(1, max), 10);
  const pid = building.googlePlaceId?.trim();
  if (pid) {
    return `placeId=${encodeURIComponent(pid)}&max=${cap}`;
  }
  const name = encodeURIComponent(pickLocalized(building.name, "ja"));
  return `lat=${building.location.lat}&lng=${building.location.lng}&name=${name}&max=${cap}`;
}
