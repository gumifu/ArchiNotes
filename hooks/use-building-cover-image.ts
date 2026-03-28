"use client";

import {
  getBuildingCoverImageUrl,
  resolveBuildingCoverImageErrorAsync,
  shouldPrefetchPlacesPhoto,
} from "@/lib/cover-image";
import type { Building } from "@/types/building";
import { useCallback, useEffect, useState } from "react";

/**
 * カバー表示用 URL と onError。
 * カバー無し、または `/images/...` などローカル相対パスのときは useEffect で Places 写真を試す。
 */
export function useBuildingCoverImageSrc(building: Building) {
  const prefetchPlaces = shouldPrefetchPlacesPhoto(building);
  const [src, setSrc] = useState(() => getBuildingCoverImageUrl(building));

  useEffect(() => {
    setSrc(getBuildingCoverImageUrl(building));
  }, [
    building.id,
    building.coverImageUrl,
    building.location.lat,
    building.location.lng,
  ]);

  useEffect(() => {
    if (!prefetchPlaces) return;
    let cancelled = false;
    (async () => {
      try {
        const name = encodeURIComponent(building.nameJa ?? building.name);
        const r = await fetch(
          `/api/places-photo?lat=${building.location.lat}&lng=${building.location.lng}&name=${name}`,
        );
        if (!r.ok || cancelled) return;
        const d = (await r.json()) as { url: string | null };
        if (d.url) setSrc(d.url);
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
    prefetchPlaces,
  ]);

  const onError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      void resolveBuildingCoverImageErrorAsync(
        building,
        (url) => setSrc(url),
        e.currentTarget.src,
        { skipPlaces: prefetchPlaces },
      );
    },
    [building, prefetchPlaces],
  );

  return { src, setSrc, onError };
}
