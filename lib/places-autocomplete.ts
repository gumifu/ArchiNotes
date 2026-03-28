/**
 * Places API (New) Autocomplete。表示用候補のみ。本文は DB に永続化しない方針。
 */

export type PlacesAutocompleteItem = {
  placeId: string;
  mainText: string;
  secondaryText?: string;
};

type AutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: {
      place?: string;
      placeId?: string;
      text?: { text?: string };
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
    };
  }>;
};

/**
 * POST https://places.googleapis.com/v1/places:autocomplete
 */
export async function fetchPlacesAutocomplete(
  input: string,
  apiKey: string,
): Promise<PlacesAutocompleteItem[]> {
  const trimmed = input.trim();
  if (trimmed.length < 3) return [];

  const res = await fetch(
    "https://places.googleapis.com/v1/places:autocomplete",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
      },
      body: JSON.stringify({
        input: trimmed,
        includedRegionCodes: ["jp"],
        languageCode: "ja",
      }),
      next: { revalidate: 0 },
    },
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `places_autocomplete_http_${res.status}: ${errText.slice(0, 200)}`,
    );
  }

  const json = (await res.json()) as AutocompleteResponse;
  const suggestions = json.suggestions ?? [];
  const out: PlacesAutocompleteItem[] = [];

  for (const s of suggestions) {
    const p = s.placePrediction;
    if (!p) continue;
    const placeId =
      p.placeId?.trim() ||
      (typeof p.place === "string"
        ? p.place.replace(/^places\//, "").trim()
        : "");
    if (!placeId) continue;
    const main =
      p.structuredFormat?.mainText?.text?.trim() ||
      p.text?.text?.trim() ||
      "";
    if (!main) continue;
    const secondary = p.structuredFormat?.secondaryText?.text?.trim();
    out.push({
      placeId,
      mainText: main,
      secondaryText: secondary || undefined,
    });
  }

  return out;
}
