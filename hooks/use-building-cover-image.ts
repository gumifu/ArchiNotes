"use client";

import {
  getBuildingCoverImageUrl,
  resolveBuildingCoverImageErrorAsync,
  shouldPrefetchPlacesPhoto,
} from "@/lib/cover-image";
import { buildPlacesPhotoQueryString } from "@/lib/places-client-query";
import { DEFAULT_MAX_PLACE_PHOTOS } from "@/lib/places-photo";
import type { Building } from "@/types/building";
import { useCallback, useEffect, useState } from "react";

type PlacesPhotoJson = {
  url: string | null;
  urls?: string[];
};

/**
 * カバー表示用 URL と onError。
 * カバー無し、または `/images/...` などローカル相対パスのときは useEffect で Places 写真を試す。
 * Places が複数返る場合は `placesPhotoUrls` に格納（ギャラリー用）。
 */
export function useBuildingCoverImageSrc(building: Building) {
  const prefetchPlaces = shouldPrefetchPlacesPhoto(building);
  const [src, setSrc] = useState(() => getBuildingCoverImageUrl(building));
  const [placesPhotoUrls, setPlacesPhotoUrls] = useState<string[]>([]);

  useEffect(() => {
    setSrc(getBuildingCoverImageUrl(building));
    setPlacesPhotoUrls([]);
  }, [
    building.id,
    building.coverImageUrl,
    building.location.lat,
    building.location.lng,
    building.googlePlaceId,
  ]);

  useEffect(() => {
    if (!prefetchPlaces) return;
    let cancelled = false;
    (async () => {
      try {
        const name = encodeURIComponent(building.nameJa ?? building.name);
        const r = await fetch(
          `/api/places-photo?lat=${building.location.lat}&lng=${building.location.lng}&name=${name}&max=${DEFAULT_MAX_PLACE_PHOTOS}`,
        );
        if (!r.ok || cancelled) return;
        const d = (await r.json()) as PlacesPhotoJson & {
          debug?: unknown;
        };
        if (d.urls?.length) {
          setPlacesPhotoUrls(d.urls);
          if (d.urls[0]) setSrc(d.urls[0]);
        } else if (d.url) {
          setSrc(d.url);
          setPlacesPhotoUrls([d.url]);
        }
      } catch {
        /* keep placeholder */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    building.id,
    building.name,
    building.nameJa,
    building.location.lat,
    building.location.lng,
    building.googlePlaceId,
    prefetchPlaces,
  ]);

  const onError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      void (async () => {
        await resolveBuildingCoverImageErrorAsync(
          building,
          (url) => setSrc(url),
          e.currentTarget.src,
          { skipPlaces: prefetchPlaces },
        );
        if (prefetchPlaces) {
          try {
            const r = await fetch(
              `/api/places-photo?${buildPlacesPhotoQueryString(building, DEFAULT_MAX_PLACE_PHOTOS)}`,
            );
            if (r.ok) {
              const d = (await r.json()) as PlacesPhotoJson;
              if (d.urls?.length) setPlacesPhotoUrls(d.urls);
              else if (d.url) setPlacesPhotoUrls([d.url]);
            }
          } catch {
            /* ignore */
          }
        }
      })();
    },
    [building, prefetchPlaces],
  );

  return { src, setSrc, onError, placesPhotoUrls };
}
