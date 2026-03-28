/**
 * サーバ内メモリの短期キャッシュ。恒久 DB キャッシュや Google 規約上の長期保存の代替ではない。
 * 方針: docs/google-maps-platform-data-policy.md
 */
import type { PlacesPhotoResult } from "@/lib/places-photo";

const TTL_MS = 24 * 60 * 60 * 1000;

type Entry = { ts: number; result: PlacesPhotoResult };

const store = new Map<string, Entry>();

export function placesPhotoCacheKey(
  lat: number,
  lng: number,
  name: string,
  max: number,
): string {
  return `${lat.toFixed(5)}|${lng.toFixed(5)}|${name.trim().toLowerCase()}|${max}`;
}

export function placesPhotoCacheKeyByPlaceId(
  placeId: string,
  max: number,
): string {
  return `place|${placeId.trim().toLowerCase()}|${max}`;
}

export function getPlacesPhotoCached(key: string): PlacesPhotoResult | null {
  const e = store.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > TTL_MS) {
    store.delete(key);
    return null;
  }
  return e.result;
}

export function setPlacesPhotoCached(
  key: string,
  result: PlacesPhotoResult,
): void {
  store.set(key, { ts: Date.now(), result });
}
