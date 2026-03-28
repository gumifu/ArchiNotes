"use client";

import { BuildingDetailMap } from "@/components/building-detail-map";
import { BuildingDetailMedia } from "@/components/building-detail-media";
import { BuildingGooglePlaceInfo } from "@/components/building-google-place-info";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMergedBuilding } from "@/hooks/use-merged-building";
import { trackBuildingStat } from "@/lib/building-stats";
import type { Building } from "@/types/building";
import {
  ArrowLeft,
  Building2,
  Calendar,
  ChevronRight,
  Globe,
  MapPin,
  Pencil,
  Train,
  User,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

function DetailSection({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className="border-border group border-b last:border-b-0"
      open={defaultOpen}
    >
      <summary className="text-foreground flex cursor-pointer list-none items-center gap-2 py-4 font-medium">
        <Icon className="text-muted-foreground size-5 shrink-0" />
        {title}
        <ChevronRight className="text-muted-foreground ml-auto size-5 shrink-0 transition-transform group-open:rotate-90" />
      </summary>
      <div className="text-muted-foreground pb-4 pl-7 text-sm">{children}</div>
    </details>
  );
}

export function BuildingDetailView({ building: initial }: { building: Building }) {
  const building = useMergedBuilding(initial);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const k = `archinotes-stats-view-${building.id}`;
    if (sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, "1");
    trackBuildingStat(building.id, "view");
  }, [building.id]);

  const yearLabel = building.yearCompleted
    ? `${building.yearCompleted}年完成`
    : "—";
  const editHref = `/buildings/${building.slug || building.id}/edit`;

  return (
    <div className="bg-background min-h-screen">
      <header className="border-border bg-background/95 sticky top-0 z-10 flex items-center justify-between gap-2 border-b px-4 py-3 backdrop-blur">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="size-4" aria-hidden />
            マップに戻る
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="shadow-none" asChild>
          <Link href={editHref} className="gap-1.5">
            <Pencil className="size-3.5" aria-hidden />
            編集
          </Link>
        </Button>
      </header>

      <main className="pb-8">
        <BuildingDetailMedia
          building={building}
          heroClassName="object-cover"
          priority
        />

        <div className="px-4 pt-4">
          <h1 className="text-foreground text-xl font-semibold">
            {building.nameJa ?? building.name}
          </h1>
          {building.nameJa && building.name !== building.nameJa && (
            <p className="text-muted-foreground mt-0.5 text-sm">
              {building.name}
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Card className="border-border shadow-none">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <User className="text-primary size-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">建築家</p>
                  <p className="text-foreground text-sm font-medium">
                    {building.architectName}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border shadow-none">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <Calendar className="text-primary size-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">完成年</p>
                  <p className="text-foreground text-sm font-medium">
                    {yearLabel}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-border mx-4 mt-6 shadow-none">
          <CardHeader className="pb-0">
            <CardTitle className="text-base">詳細情報</CardTitle>
          </CardHeader>
          <CardContent className="p-0 px-4">
            <DetailSection title="基本情報" icon={Building2} defaultOpen={true}>
              <ul className="space-y-1.5">
                <li>
                  <span className="text-foreground font-medium">建築家:</span>{" "}
                  {building.architectName}
                </li>
                <li>
                  <span className="text-foreground font-medium">完成年:</span>{" "}
                  {yearLabel}
                </li>
                <li>
                  <span className="text-foreground font-medium">所在地:</span>{" "}
                  {building.country} / {building.city}
                  {building.ward && ` ${building.ward}`}
                </li>
                {building.buildingType && (
                  <li>
                    <span className="text-foreground font-medium">用途:</span>{" "}
                    {building.buildingType}
                  </li>
                )}
                {building.style && (
                  <li>
                    <span className="text-foreground font-medium">様式:</span>{" "}
                    {building.style}
                  </li>
                )}
              </ul>
            </DetailSection>

            <DetailSection title="建築について" icon={Building2}>
              {building.shortDescription && (
                <p className="mb-2">{building.shortDescription}</p>
              )}
              {building.description && (
                <p className="whitespace-pre-wrap">{building.description}</p>
              )}
              {building.designHighlights &&
                building.designHighlights.length > 0 && (
                  <div className="mt-2">
                    <p className="text-foreground mb-1 font-medium">見どころ</p>
                    <ul className="list-inside list-disc space-y-0.5">
                      {building.designHighlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}
              {!building.description &&
                !building.shortDescription &&
                (!building.designHighlights ||
                  building.designHighlights.length === 0) && (
                  <p className="text-muted-foreground">説明はありません</p>
                )}
            </DetailSection>

            <DetailSection title="アクセス" icon={MapPin}>
              <div className="space-y-3">
                <BuildingDetailMap
                  lat={building.location.lat}
                  lng={building.location.lng}
                  name={building.name}
                />
                {building.address && (
                  <p className="flex items-start gap-2">
                    <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                    <span>{building.address}</span>
                  </p>
                )}
                {building.nearestStation && (
                  <p className="flex items-center gap-2">
                    <Train className="text-muted-foreground size-4 shrink-0" />
                    <span>最寄り: {building.nearestStation}</span>
                  </p>
                )}
              </div>
            </DetailSection>

            <DetailSection title="Google Places" icon={Globe} defaultOpen={true}>
              {building.googlePlaceId ? (
                <BuildingGooglePlaceInfo building={building} />
              ) : (
                <p className="text-muted-foreground text-sm">
                  <Link
                    href={editHref}
                    className="text-primary font-medium underline"
                  >
                    編集画面
                  </Link>
                  から Google の place ID を入力すると、営業時間やカテゴリを表示できます。
                </p>
              )}
            </DetailSection>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
