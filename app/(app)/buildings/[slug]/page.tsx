import { BuildingDetailView } from "@/components/building-detail-view";
import {
  permanentRedirectToCanonicalBuildingPath,
  resolveBuildingFromUrlSegment,
} from "@/lib/building-resolve";
import { DEFAULT_LOCALE, pickLocalized } from "@/lib/locale-text";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug: param } = await params;
  const building = await resolveBuildingFromUrlSegment(param);
  if (!building) return { title: "建築が見つかりません" };
  const titleName = pickLocalized(building.name, DEFAULT_LOCALE);
  const summarySnippet = pickLocalized(building.summary, DEFAULT_LOCALE).slice(
    0,
    120,
  );
  const arch = pickLocalized(building.architectName, DEFAULT_LOCALE);
  return {
    title: `${titleName || "建築"} | ArchiNotes`,
    description:
      summarySnippet ||
      (arch ? `${arch}設計。${building.city}。` : `${building.city}。`),
  };
}

export default async function BuildingDetailPage({ params }: Props) {
  const { slug: param } = await params;
  const building = await resolveBuildingFromUrlSegment(param);
  if (!building) notFound();

  permanentRedirectToCanonicalBuildingPath(param, building);

  return <BuildingDetailView building={building} />;
}
