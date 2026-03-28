"use client";

import { useBuildingCoverImageSrc } from "@/hooks/use-building-cover-image";
import { useUiLocale } from "@/hooks/use-ui-locale";
import { appUiStrings } from "@/lib/app-ui-strings";
import { getImageUrl } from "@/lib/constants";
import { pickLocalized } from "@/lib/locale-text";
import type { Building } from "@/types/building";
import Image from "next/image";
import { useMemo } from "react";

type BuildingDetailMediaProps = {
  building: Building;
  heroClassName?: string;
  priority?: boolean;
};

/**
 * 詳細ページ用: Places 取得フックを 1 回だけ実行し、ヒーローと写真グリッドを共有する。
 */
export function BuildingDetailMedia({
  building,
  heroClassName,
  priority,
}: BuildingDetailMediaProps) {
  const locale = useUiLocale();
  const ui = appUiStrings(locale);
  const {
    src: coverSrc,
    onError,
    placesPhotoUrls,
  } = useBuildingCoverImageSrc(building);

  const mergedGallery = useMemo(() => {
    const urls: string[] = [];
    for (const u of building.gallery ?? []) {
      const resolved = getImageUrl(u);
      if (!urls.includes(resolved)) urls.push(resolved);
    }
    for (const u of placesPhotoUrls) {
      if (!urls.includes(u)) urls.push(u);
    }
    return urls;
  }, [building.gallery, placesPhotoUrls]);

  const gridUrls = useMemo(
    () => mergedGallery.filter((u) => u !== coverSrc),
    [mergedGallery, coverSrc],
  );

  return (
    <>
      <div className="-mx-4 sm:-mx-6">
        <div className="bg-muted relative h-[220px] w-full sm:h-[260px]">
          <Image
            src={coverSrc}
            alt={pickLocalized(building.name, locale)}
            fill
            className={heroClassName}
            sizes="(max-width: 768px) 100vw, 768px"
            priority={priority}
            onError={onError}
          />
        </div>
      </div>

      {gridUrls.length > 0 && (
        <section className="mt-6 px-4">
          <h2 className="text-foreground mb-3 text-lg font-semibold">
            {ui.photosHeading}
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {gridUrls.map((url, i) => (
              <div
                key={`${url}-${i}`}
                className="bg-muted relative h-24 overflow-hidden rounded-lg sm:h-28"
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 240px"
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
