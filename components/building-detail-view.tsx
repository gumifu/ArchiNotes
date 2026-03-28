"use client";

import { BuildingDetailMap } from "@/components/building-detail-map";
import { BuildingDetailMedia } from "@/components/building-detail-media";
import { BuildingGooglePlaceInfo } from "@/components/building-google-place-info";
import { FieldWithAiMeta } from "@/components/field-with-ai-meta";
import { FormAiHint } from "@/components/form-ai-hint";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMergedBuilding } from "@/hooks/use-merged-building";
import { useUiLocale } from "@/hooks/use-ui-locale";
import { appUiStrings } from "@/lib/app-ui-strings";
import { trackBuildingStat } from "@/lib/building-stats";
import { hasLocaleValidationIssues, pickLocalized } from "@/lib/locale-text";
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
  const locale = useUiLocale();
  const ui = appUiStrings(locale);
  const displayName = pickLocalized(building.name, locale);
  const altName =
    locale === "ja"
      ? building.name.en?.trim() ?? ""
      : building.name.ja?.trim() ?? "";
  const showNameSubtitle = Boolean(altName && altName !== displayName);
  const architectDisplay = pickLocalized(building.architectName, locale);
  const summaryDisplay = pickLocalized(building.summary, locale);
  const addressDisplay = pickLocalized(building.address, locale);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const k = `archinotes-stats-view-${building.id}`;
    if (sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, "1");
    trackBuildingStat(building.id, "view");
  }, [building.id]);

  const yearLabel = building.yearCompleted
    ? ui.yearCompleted(building.yearCompleted)
    : "—";
  const editHref = `/buildings/${building.slug || building.id}/edit`;

  return (
    <div className="bg-background min-h-screen">
      <header className="border-border bg-background/95 sticky top-0 z-10 -mx-4 flex items-center justify-between gap-2 border-b px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="size-4" aria-hidden />
            {ui.detailBackToMap}
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="shadow-none" asChild>
          <Link href={editHref} className="gap-1.5">
            <Pencil className="size-3.5" aria-hidden />
            {ui.detailEdit}
          </Link>
        </Button>
      </header>

      <main className="pb-8">
        <BuildingDetailMedia
          building={building}
          heroClassName="object-cover"
          priority
        />

        <div className="pt-4">
          <h1 className="text-foreground text-xl font-semibold">
            {displayName || "—"}
          </h1>
          {showNameSubtitle && (
            <p className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm">
              <span>{altName}</span>
              <FormAiHint show={Boolean(building.aiMeta?.nameEn?.isAiSuggested)} />
            </p>
          )}
          {hasLocaleValidationIssues(building.localeValidation ?? {}) && (
            <p className="text-amber-800 dark:text-amber-200 mt-2 text-xs">
              {ui.detailLocaleValidationHint}
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Card className="border-border shadow-none">
              <CardContent className="flex min-w-0 items-start gap-3 p-3">
                <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <User className="text-primary size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <FieldWithAiMeta
                    label={ui.detailFieldArchitect}
                    value={architectDisplay || "—"}
                    aiMeta={building.aiMeta?.architectName}
                  />
                </div>
              </CardContent>
            </Card>
            <Card className="border-border shadow-none">
              <CardContent className="flex min-w-0 items-start gap-3 p-3">
                <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <Calendar className="text-primary size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <FieldWithAiMeta
                    label={ui.detailFieldYear}
                    value={yearLabel}
                    aiMeta={building.aiMeta?.year}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-border mt-6 shadow-none">
          <CardHeader className="pb-0">
            <CardTitle className="text-base">{ui.detailInfoTitle}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 px-4">
            <DetailSection title={ui.detailBasicInfo} icon={Building2} defaultOpen={true}>
              <ul className="space-y-1.5">
                <FieldWithAiMeta
                  variant="inline"
                  label={ui.detailFieldArchitect}
                  value={architectDisplay || "—"}
                  aiMeta={building.aiMeta?.architectName}
                />
                <FieldWithAiMeta
                  variant="inline"
                  label={ui.detailFieldYear}
                  value={yearLabel}
                  aiMeta={building.aiMeta?.year}
                />
                <li>
                  <span className="text-foreground font-medium">
                    {ui.detailLabelLocation}:
                  </span>{" "}
                  {building.country} / {building.city}
                  {building.ward && ` ${building.ward}`}
                </li>
                {building.buildingType && (
                  <li>
                    <span className="text-foreground font-medium">
                      {ui.detailLabelUse}:
                    </span>{" "}
                    {building.buildingType}
                  </li>
                )}
                {building.style && (
                  <li>
                    <span className="text-foreground font-medium">
                      {ui.detailLabelStyle}:
                    </span>{" "}
                    {building.style}
                  </li>
                )}
              </ul>
            </DetailSection>

            <DetailSection title={ui.detailSectionAbout} icon={Building2}>
              {summaryDisplay ? (
                <FieldWithAiMeta
                  label={ui.detailLabelDescription}
                  variant="block"
                  hideLabel
                  aiMeta={building.aiMeta?.summary}
                  value={
                    <p className="whitespace-pre-wrap">{summaryDisplay}</p>
                  }
                />
              ) : null}
              {building.designHighlights &&
                building.designHighlights.length > 0 && (
                  <div
                    className={
                      summaryDisplay ? "mt-4" : undefined
                    }
                  >
                    <p className="text-foreground mb-1 font-medium">
                      {ui.detailHighlights}
                    </p>
                    <ul className="list-inside list-disc space-y-0.5">
                      {building.designHighlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}
              {!summaryDisplay &&
                (!building.designHighlights ||
                  building.designHighlights.length === 0) && (
                  <p className="text-muted-foreground">{ui.detailNoDescription}</p>
                )}
            </DetailSection>

            <DetailSection title={ui.detailAccess} icon={MapPin}>
              <div className="space-y-3">
                <BuildingDetailMap
                  lat={building.location.lat}
                  lng={building.location.lng}
                  name={displayName || "—"}
                />
                {addressDisplay ? (
                  <p className="flex items-start gap-2">
                    <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                    <span>{addressDisplay}</span>
                  </p>
                ) : null}
                {building.nearestStation && (
                  <p className="flex items-center gap-2">
                    <Train className="text-muted-foreground size-4 shrink-0" />
                    <span>
                      {ui.detailNearestStation(building.nearestStation)}
                    </span>
                  </p>
                )}
              </div>
            </DetailSection>

            <DetailSection title={ui.detailGooglePlaces} icon={Globe} defaultOpen={true}>
              {building.googlePlaceId ? (
                <BuildingGooglePlaceInfo building={building} />
              ) : locale === "en" ? (
                <p className="text-muted-foreground text-sm">
                  {ui.detailGooglePlaceIdHintEnBefore}
                  <Link
                    href={editHref}
                    className="text-primary font-medium underline"
                  >
                    {ui.detailEditPageLink}
                  </Link>
                  {ui.detailGooglePlaceIdHintEnAfter}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm">
                  <Link
                    href={editHref}
                    className="text-primary font-medium underline"
                  >
                    {ui.detailEditPageLink}
                  </Link>
                  {ui.detailGooglePlaceIdHintJaSuffix}
                </p>
              )}
            </DetailSection>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
