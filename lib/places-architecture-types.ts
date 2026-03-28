/**
 * Google Places の primaryType / types と照合し、建築・観光・文化施設として妥当か判定する。
 * @see https://developers.google.com/maps/documentation/places/web-service/place-types
 */

/** このいずれかに該当すれば「妥当」とみなす（厳しめ） */
const ARCHITECTURE_CORE_TYPES = new Set([
  "tourist_attraction",
  "museum",
  "art_gallery",
  "stadium",
  "athletic_field",
  "sports_complex",
  "sports_activity_location",
  "landmark",
  "church",
  "place_of_worship",
  "library",
  "university",
  "monument",
  "synagogue",
  "mosque",
  "hindu_temple",
  "zoo",
  "park",
  "city_hall",
  "courthouse",
  "embassy",
  "cemetery",
  "historical_landmark",
  "amusement_park",
  "aquarium",
  "performing_arts_theater",
  "event_venue",
  "cultural_center",
  "national_park",
]);

/** 単独では弱いが、コア型と併記されることが多い */
const GENERIC_TYPES = new Set([
  "point_of_interest",
  "establishment",
  "premise",
  "subpremise",
]);

function isGenericOnlyTypes(all: Set<string>): boolean {
  if (all.size === 0) return false;
  return [...all].every((t) => GENERIC_TYPES.has(t));
}

export type ArchitectureTypeValidation = {
  level: "ok" | "warning" | "mismatch";
  /** ARCHITECTURE_CORE_TYPES にヒットしたもの */
  matchedCore: string[];
  /** GENERIC のみに見える場合のメッセージ */
  message?: string;
};

export function validateArchitecturePlaceTypes(
  primaryType: string | undefined,
  types: string[] | undefined,
): ArchitectureTypeValidation {
  const list = types ?? [];
  const primary = primaryType?.trim() ?? "";
  const all = new Set<string>([...list, ...(primary ? [primary] : [])]);

  const matchedCore = [...all].filter((t) => ARCHITECTURE_CORE_TYPES.has(t));

  if (matchedCore.length > 0) {
    return { level: "ok", matchedCore };
  }

  if (all.size === 0) {
    return {
      level: "warning",
      matchedCore: [],
      message: "カテゴリ情報がありません。",
    };
  }

  if (isGenericOnlyTypes(all)) {
    return {
      level: "warning",
      matchedCore: [],
      message:
        "カテゴリが汎用のみです。別施設の可能性があります。Place ID を確認してください。",
    };
  }

  return {
    level: "mismatch",
    matchedCore: [],
    message:
      "建築・観光スポットとして想定されないカテゴリです。googlePlaceId の取り違えを確認してください。",
  };
}
