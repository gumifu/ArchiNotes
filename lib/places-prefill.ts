/**
 * 新規建築フォーム用: Place Details の最小フィールドを取得。
 * `languageCode=ja` / `en` で2回取得し、LocalizedText の両側に載せる。
 * 表示用の正規データはユーザー編集後の LocalizedText。Google のレスポンスは rawSource に保持する。
 */

import type { LocaleCode } from "@/lib/locale-text";
import type { BuildingRawSource } from "@/types/building";

export type PlaceMvpPrefill = {
  place_id: string;
  name: { ja: string; en: string };
  address: { ja: string; en: string };
  lat: number;
  lng: number;
  rawSource: BuildingRawSource;
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

async function fetchPlaceDetailsMinimal(
  placeId: string,
  apiKey: string,
  uiLocale: LocaleCode,
): Promise<PlaceDetailsMinimal> {
  const id = placeId.trim();
  if (!id) throw new Error("empty_place_id");

  const url = new URL(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`,
  );
  url.searchParams.set("languageCode", uiLocale);

  const res = await fetch(url.toString(), {
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

  return (await res.json()) as PlaceDetailsMinimal;
}

/**
 * Places API (New) GET /v1/places/{place_id} を ja / en で取得してマージ。
 */
export async function fetchPlaceMvpPrefill(
  placeId: string,
  apiKey: string,
): Promise<PlaceMvpPrefill> {
  const id = placeId.trim();
  if (!id) throw new Error("empty_place_id");

  const [jaOutcome, enOutcome] = await Promise.allSettled([
    fetchPlaceDetailsMinimal(id, apiKey, "ja"),
    fetchPlaceDetailsMinimal(id, apiKey, "en"),
  ]);

  const jsonJa = jaOutcome.status === "fulfilled" ? jaOutcome.value : null;
  const jsonEn = enOutcome.status === "fulfilled" ? enOutcome.value : null;

  if (!jsonJa && !jsonEn) {
    const err =
      jaOutcome.status === "rejected"
        ? jaOutcome.reason
        : enOutcome.status === "rejected"
          ? enOutcome.reason
          : null;
    throw new Error(
      err instanceof Error ? err.message : "places_prefill_failed_both",
    );
  }

  const primary = jsonEn ?? jsonJa!;
  const lat = primary.location?.latitude;
  const lng = primary.location?.longitude;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("missing_location");
  }

  const nameJa = jsonJa?.displayName?.text?.trim() ?? "";
  const nameEn = jsonEn?.displayName?.text?.trim() ?? "";
  const addressJa = jsonJa?.formattedAddress?.trim() ?? "";
  const addressEn = jsonEn?.formattedAddress?.trim() ?? "";

  const resolvedId =
    jsonEn?.id?.trim() ?? jsonJa?.id?.trim() ?? id;

  /** 旧単一言語 prefill と同様: 名称が空なら住所を名称表示に使う */
  function pickDisplayName(
    json: PlaceDetailsMinimal | null,
    name: string,
    addr: string,
  ): string {
    if (!json) return "";
    const combined = (name || addr).trim();
    return combined || "名称未設定";
  }

  return {
    place_id: resolvedId,
    name: {
      ja: pickDisplayName(jsonJa, nameJa, addressJa),
      en: pickDisplayName(jsonEn, nameEn, addressEn),
    },
    address: {
      ja: addressJa,
      en: addressEn,
    },
    lat: lat as number,
    lng: lng as number,
    rawSource: {
      googlePlaces: {
        ja: jsonJa ? ({ ...jsonJa } as Record<string, unknown>) : null,
        en: jsonEn ? ({ ...jsonEn } as Record<string, unknown>) : null,
      } as Record<string, unknown>,
    },
  };
}
