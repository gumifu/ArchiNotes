"use client";

import { useBuildingCoverImageSrc } from "@/hooks/use-building-cover-image";
import { useUiLocale } from "@/hooks/use-ui-locale";
import { pickLocalized } from "@/lib/locale-text";
import type { Building } from "@/types/building";
import Image from "next/image";

type BuildingCardProps = {
  building: Building;
  className?: string;
};

export function BuildingCard({ building, className = "" }: BuildingCardProps) {
  const locale = useUiLocale();
  const { src, onError } = useBuildingCoverImageSrc(building);
  const yearLabel = building.yearCompleted ? `${building.yearCompleted}` : "—";
  const locationLabel = [building.city, building.country]
    .filter(Boolean)
    .join(", ");
  const primaryName = pickLocalized(building.name, locale);
  const altName = pickLocalized(building.name, locale === "ja" ? "en" : "ja");
  const showAlt =
    Boolean(altName) && altName !== primaryName;
  const architectLine = pickLocalized(building.architectName, locale);
  const summaryLine = pickLocalized(building.summary, locale);

  return (
    <article
      className={`flex flex-col overflow-hidden ${className}`}
      aria-label={primaryName || "Building"}
    >
      <div className="bg-muted relative aspect-16/10 w-full">
        <Image
          src={src}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 720px"
          onError={onError}
        />
      </div>
      <div className="flex flex-col gap-1 px-0 py-3">
        <h2 className="text-foreground text-lg font-semibold tracking-tight">
          {primaryName || "—"}
        </h2>
        {showAlt && (
          <p className="text-muted-foreground text-sm">{altName}</p>
        )}
        <p className="text-muted-foreground text-sm">
          {architectLine}
        </p>
        <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-0 text-xs">
          <span>{yearLabel}</span>
          {locationLabel && <span>{locationLabel}</span>}
        </div>
        {summaryLine ? (
          <p className="text-muted-foreground mt-2 line-clamp-3 text-sm leading-relaxed">
            {summaryLine}
          </p>
        ) : null}
      </div>
    </article>
  );
}
