import { BuildingDetailMap } from "@/components/building-detail-map";
import { BuildingHeroImage } from "@/components/building-hero-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBuildingById, getBuildingBySlug } from "@/lib/buildings";
import { getImageUrl } from "@/lib/constants";
import {
  ArrowLeft,
  Building2,
  Calendar,
  ChevronRight,
  MapPin,
  Train,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const building = getBuildingBySlug(id) ?? getBuildingById(id);
  if (!building) return { title: "建築が見つかりません" };
  return {
    title: `${building.nameJa ?? building.name} | ArchiNotes`,
    description:
      building.shortDescription ??
      building.description?.slice(0, 120) ??
      `${building.architectName}設計。${building.city}。`,
  };
}

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

export default async function BuildingDetailPage({ params }: Props) {
  const { id } = await params;
  const building = getBuildingBySlug(id) ?? getBuildingById(id);
  if (!building) notFound();

  const yearLabel = building.yearCompleted
    ? `${building.yearCompleted}年完成`
    : "—";

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="border-border bg-background/95 sticky top-0 z-10 flex items-center border-b px-4 py-3 backdrop-blur">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="size-4" aria-hidden />
            マップに戻る
          </Link>
        </Button>
      </header>

      <main className="pb-8">
        {/* Hero Image */}
        <div className="bg-muted relative aspect-[4/3] w-full">
          <BuildingHeroImage
            building={building}
            className="object-cover"
            priority
          />
        </div>

        {/* Title & Key Info */}
        <div className="px-4 pt-4">
          <h1 className="text-foreground text-xl font-semibold">
            {building.nameJa ?? building.name}
          </h1>
          {building.nameJa && building.name !== building.nameJa && (
            <p className="text-muted-foreground mt-0.5 text-sm">
              {building.name}
            </p>
          )}

          {/* Key data boxes (参考: サウナの温度ボックス) */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Card className="border-border overflow-hidden">
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
            <Card className="border-border overflow-hidden">
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

        {/* Collapsible Sections */}
        <Card className="border-border mx-4 mt-6 overflow-hidden">
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
          </CardContent>
        </Card>

        {/* Photo Gallery */}
        {(building.gallery?.length ?? 0) > 0 && (
          <section className="mt-6 px-4">
            <h2 className="text-foreground mb-3 text-lg font-semibold">写真</h2>
            <div className="grid grid-cols-3 gap-2">
              {building.gallery!.map((url, i) => (
                <div
                  key={i}
                  className="bg-muted relative aspect-square overflow-hidden rounded-lg"
                >
                  <Image
                    src={getImageUrl(url)}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 33vw, 200px"
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
