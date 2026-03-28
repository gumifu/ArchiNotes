/**
 * Google Places API（レガシー）: Text Search → Place Details → Photo URLs（複数）。
 * `place_id` が分かっている場合は Text Search を省略できる。
 * サーバー（Route Handler）からのみ呼び出す。API キーに Places API を有効化すること。
 *
 * 永続化は place_id を中心にする。写真 URL / photo_reference を DB に長期保存しない方針は
 * docs/google-maps-platform-data-policy.md を参照。
 */

/** Place Details で取得する写真の最大枚数（Photo API 課金は画像リクエスト単位） */
export const DEFAULT_MAX_PLACE_PHOTOS = 8;

export type PlacesPhotoResult = {
  /** 先頭 1 枚（互換・カバー用） */
  url: string | null;
  /** 取得できた写真 URL（最大 max 件） */
  urls: string[];
  /** url が null のときの切り分け用（キーは含めない） */
  debug: {
    textSearchStatus: string;
    textSearchErrorMessage?: string;
    detailsStatus?: string;
    detailsErrorMessage?: string;
    placeId?: string;
    /** 簡潔な理由（ログ・UI 向け） */
    reason?: string;
    photoCount?: number;
  };
};

function buildPhotoUrl(photoRef: string, apiKey: string): string {
  return (
    `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800` +
    `&photo_reference=${encodeURIComponent(photoRef)}&key=${encodeURIComponent(apiKey)}`
  );
}

async function fetchPhotosFromLegacyPlaceDetails(
  placeId: string,
  apiKey: string,
  cap: number,
  debugPrefix: {
    textSearchStatus: string;
    textSearchErrorMessage?: string;
  },
): Promise<PlacesPhotoResult> {
  const detailsUrl =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${encodeURIComponent(placeId)}&fields=photos&key=${encodeURIComponent(apiKey)}`;

  const detailsRes = await fetch(detailsUrl);
  const detailsJson = (await detailsRes.json()) as {
    status?: string;
    error_message?: string;
    result?: { photos?: { photo_reference: string }[] };
  };

  const detailsStatus = detailsJson.status ?? "UNKNOWN";
  const detailsErrorMessage = detailsJson.error_message;

  if (detailsStatus !== "OK" || !detailsJson.result?.photos?.length) {
    return {
      url: null,
      urls: [],
      debug: {
        ...debugPrefix,
        placeId,
        detailsStatus,
        detailsErrorMessage,
        reason:
          detailsStatus !== "OK"
            ? "place_details_not_ok"
            : "place_has_no_photos_in_google",
      },
    };
  }

  const refs = detailsJson.result.photos
    .slice(0, cap)
    .map((p) => p.photo_reference);
  const urls = refs.map((ref) => buildPhotoUrl(ref, apiKey));
  const url = urls[0] ?? null;

  return {
    url,
    urls,
    debug: {
      ...debugPrefix,
      placeId,
      detailsStatus,
      photoCount: urls.length,
    },
  };
}

/**
 * 固定 `place_id` から写真 URL のみ取得（Text Search なし）。
 */
export async function fetchPlacePhotosByPlaceId(
  placeId: string,
  apiKey: string,
  maxPhotos: number,
): Promise<PlacesPhotoResult> {
  const cap = Math.min(Math.max(1, maxPhotos), 10);
  return fetchPhotosFromLegacyPlaceDetails(placeId, apiKey, cap, {
    textSearchStatus: "SKIPPED_FIXED_PLACE_ID",
  });
}

/**
 * type=establishment は美術館・スタジアム等を弾くことがあるため付けない。
 * `options.placeId` があれば名前検索をせずその施設の写真のみ取得。
 */
export async function fetchPlacePhotosFromGoogle(
  lat: number,
  lng: number,
  name: string,
  apiKey: string,
  maxPhotos: number,
  options?: { placeId?: string },
): Promise<PlacesPhotoResult> {
  const cap = Math.min(Math.max(1, maxPhotos), 10);
  const fixedId = options?.placeId?.trim();

  if (fixedId) {
    return fetchPlacePhotosByPlaceId(fixedId, apiKey, cap);
  }

  const query = encodeURIComponent(name.trim());
  const textSearchUrl =
    `https://maps.googleapis.com/maps/api/place/textsearch/json` +
    `?query=${query}&location=${lat},${lng}&radius=2000&key=${encodeURIComponent(apiKey)}`;

  const searchRes = await fetch(textSearchUrl);
  const searchJson = (await searchRes.json()) as {
    status?: string;
    error_message?: string;
    results?: { place_id: string }[];
  };

  const textSearchStatus = searchJson.status ?? "UNKNOWN";
  const textSearchErrorMessage = searchJson.error_message;

  if (textSearchStatus !== "OK" || !searchJson.results?.length) {
    return {
      url: null,
      urls: [],
      debug: {
        textSearchStatus,
        textSearchErrorMessage,
        reason:
          textSearchStatus === "ZERO_RESULTS"
            ? "text_search_zero_results"
            : textSearchStatus === "REQUEST_DENIED"
              ? "text_search_request_denied_check_api_key_and_places_api"
              : "text_search_no_results_or_not_ok",
      },
    };
  }

  const placeId = searchJson.results[0].place_id;
  return fetchPhotosFromLegacyPlaceDetails(placeId, apiKey, cap, {
    textSearchStatus,
    textSearchErrorMessage,
  });
}

/** @deprecated 名前互換。fetchPlacePhotosFromGoogle を使う */
export async function fetchPlacePhotoUrlFromGoogle(
  lat: number,
  lng: number,
  name: string,
  apiKey: string,
): Promise<PlacesPhotoResult> {
  return fetchPlacePhotosFromGoogle(
    lat,
    lng,
    name,
    apiKey,
    DEFAULT_MAX_PLACE_PHOTOS,
  );
}
