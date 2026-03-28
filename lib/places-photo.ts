/**
 * Google Places API（レガシー）: Text Search → Place Details → Photo URL。
 * サーバー（Route Handler）からのみ呼び出す。API キーに Places API を有効化すること。
 */

export type PlacesPhotoResult = {
  url: string | null;
  /** url が null のときの切り分け用（キーは含めない） */
  debug: {
    textSearchStatus: string;
    textSearchErrorMessage?: string;
    detailsStatus?: string;
    detailsErrorMessage?: string;
    placeId?: string;
    /** 簡潔な理由（ログ・UI 向け） */
    reason?: string;
  };
};

/**
 * type=establishment は美術館・スタジアム等を弾くことがあるため付けない。
 */
export async function fetchPlacePhotoUrlFromGoogle(
  lat: number,
  lng: number,
  name: string,
  apiKey: string,
): Promise<PlacesPhotoResult> {
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
      debug: {
        textSearchStatus,
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

  const photoRef = detailsJson.result.photos[0].photo_reference;
  const url =
    `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800` +
    `&photo_reference=${encodeURIComponent(photoRef)}&key=${encodeURIComponent(apiKey)}`;

  return {
    url,
    debug: {
      textSearchStatus,
      placeId,
      detailsStatus,
    },
  };
}
