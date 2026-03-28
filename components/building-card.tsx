"use client";

import { getImageUrl } from "@/lib/constants";
import type { Building } from "@/types/building";

type BuildingCardProps = {
  building: Building;
  className?: string;
};

export function BuildingCard({ building, className = "" }: BuildingCardProps) {
  const yearLabel = building.yearCompleted ? `${building.yearCompleted}` : "—";
  const locationLabel = [building.city, building.country]
    .filter(Boolean)
    .join(", ");

  return (
    <article
      className={`flex flex-col overflow-hidden ${className}`}
      aria-label={building.name}
    >
      <div className="bg-muted relative aspect-16/10 w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getImageUrl(building.coverImageUrl)}
          alt=""
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.src = getImageUrl(null);
          }}
        />
      </div>
      <div className="flex flex-col gap-1 px-0 py-3">
        <h2 className="text-foreground text-lg font-semibold tracking-tight">
          {building.nameJa ?? building.name}
        </h2>
        {building.nameJa && building.name !== building.nameJa && (
          <p className="text-muted-foreground text-sm">{building.name}</p>
        )}
        <p className="text-muted-foreground text-sm">
          {building.architectName}
        </p>
        <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-0 text-xs">
          <span>{yearLabel}</span>
          {locationLabel && <span>{locationLabel}</span>}
        </div>
        {building.shortDescription && (
          <p className="text-muted-foreground mt-2 line-clamp-3 text-sm leading-relaxed">
            {building.shortDescription}
          </p>
        )}
      </div>
    </article>
  );
}
