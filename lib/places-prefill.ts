/**
 * 新規建築フォーム用: Place Details の最小フィールドのみ取得。
 * Google の本文をアプリ DB にマスタ保存しない方針 — place_id とユーザー確定後のフィールドのみ保存。
 */

export type PlaceMvpPrefill = {
  place_id: string;
  /** 表示名（displayName） */
  name: string;
  name_en?: string;
  address: string;
  lat: number;
  lng: number;
};

const PREFILL_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
].join(",");

type PlaceDetailsMinimal = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
};

/**
 * Places API (New) GET /v1/places/{place_id}
 */
export async function fetchPlaceMvpPrefill(
  placeId: string,
  apiKey: string,
): Promise<PlaceMvpPrefill> {
  const id = placeId.trim();
  if (!id) throw new Error("empty_place_id");

  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`;

  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": PREFILL_FIELD_MASK,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `places_prefill_http_${res.status}: ${errText.slice(0, 200)}`,
    );
  }

  const json = (await res.json()) as PlaceDetailsMinimal;
  const name = json.displayName?.text?.trim() ?? "";
  const address = json.formattedAddress?.trim() ?? "";
  const lat = json.location?.latitude;
  const lng = json.location?.longitude;
  const resolvedId = json.id?.trim() ?? id;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("missing_location");
  }

  return {
    place_id: resolvedId,
    name: name || address || "名称未設定",
    address,
    lat: lat as number,
    lng: lng as number,
  };
}
