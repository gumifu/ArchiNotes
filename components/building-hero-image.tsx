"use client";

import { useBuildingCoverImageSrc } from "@/hooks/use-building-cover-image";
import type { Building } from "@/types/building";
import Image from "next/image";

type BuildingHeroImageProps = {
  building: Building;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/**
 * 建築詳細ページのヒーロー。Places 写真 → Static → プレースホルダーの順でフォールバック。
 */
export function BuildingHeroImage({
  building,
  className,
  sizes = "100vw",
  priority,
}: BuildingHeroImageProps) {
  const { src, onError } = useBuildingCoverImageSrc(building);

  return (
    <Image
      src={src}
      alt={building.nameJa ?? building.name}
      fill
      className={className}
      sizes={sizes}
      priority={priority}
      onError={onError}
    />
  );
}
