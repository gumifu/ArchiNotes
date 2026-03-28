/**
 * サーバ内メモリの短期キャッシュ。恒久 DB キャッシュの代替ではない。
 * 方針: docs/google-maps-platform-data-policy.md
 */
import type { LocaleCode } from "@/lib/locale-text";
import type { PlaceDetailsPayload } from "@/lib/places-details";

const TTL_MS = 24 * 60 * 60 * 1000;

type Entry = { ts: number; payload: PlaceDetailsPayload };

const store = new Map<string, Entry>();

export function placesDetailsCacheKey(
  placeId: string,
  uiLocale: LocaleCode = "en",
): string {
  return `${placeId.trim().toLowerCase()}::${uiLocale}`;
}

export function getPlaceDetailsCached(key: string): PlaceDetailsPayload | null {
  const e = store.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > TTL_MS) {
    store.delete(key);
    return null;
  }
  return e.payload;
}

export function setPlaceDetailsCached(
  key: string,
  payload: PlaceDetailsPayload,
): void {
  store.set(key, { ts: Date.now(), payload });
}
