/**
 * Places API (New) の Place Details。表示時取得用。
 * レスポンス本文は Firestore にマスタとして長期保存しない方針 — docs/google-maps-platform-data-policy.md
 */
import {
  validateArchitecturePlaceTypes,
  type ArchitectureTypeValidation,
} from "@/lib/places-architecture-types";

/** Places API (New) の Place Details から返す正規化データ */
export type PlaceDetailsPayload = {
  regularOpeningHours?: {
    weekdayDescriptions?: string[];
    periods?: unknown[];
    openNow?: boolean;
  } | null;
  currentOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
    periods?: unknown[];
  } | null;
  primaryType?: string;
  primaryTypeDisplayName?: { text?: string; languageCode?: string } | null;
  types?: string[];
  businessStatus?: string;
  containingPlaces?: Array<{
    name?: string;
    id?: string;
    displayName?: { text?: string; languageCode?: string };
  }>;
  googleMapsUri?: string;
  typeValidation: ArchitectureTypeValidation;
};

const FIELD_MASK = [
  "regularOpeningHours",
  "currentOpeningHours",
  "primaryType",
  "primaryTypeDisplayName",
  "types",
  "businessStatus",
  "containingPlaces",
  "googleMapsUri",
].join(",");

/**
 * Places API (New) GET /v1/places/{place_id}
 * @see https://developers.google.com/maps/documentation/places/web-service/place-details
 */
export async function fetchPlaceDetailsNew(
  placeId: string,
  apiKey: string,
): Promise<PlaceDetailsPayload> {
  const id = placeId.trim();
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`;

  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `places_details_http_${res.status}: ${errText.slice(0, 200)}`,
    );
  }

  const json = (await res.json()) as {
    regularOpeningHours?: PlaceDetailsPayload["regularOpeningHours"];
    currentOpeningHours?: PlaceDetailsPayload["currentOpeningHours"];
    primaryType?: string;
    primaryTypeDisplayName?: PlaceDetailsPayload["primaryTypeDisplayName"];
    types?: string[];
    businessStatus?: string;
    containingPlaces?: PlaceDetailsPayload["containingPlaces"];
    googleMapsUri?: string;
  };

  const typeValidation = validateArchitecturePlaceTypes(
    json.primaryType,
    json.types,
  );

  return {
    regularOpeningHours: json.regularOpeningHours ?? null,
    currentOpeningHours: json.currentOpeningHours ?? null,
    primaryType: json.primaryType,
    primaryTypeDisplayName: json.primaryTypeDisplayName ?? null,
    types: json.types,
    businessStatus: json.businessStatus,
    containingPlaces: json.containingPlaces,
    googleMapsUri: json.googleMapsUri,
    typeValidation,
  };
}
