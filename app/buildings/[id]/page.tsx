import { BuildingDetailView } from "@/components/building-detail-view";
import { getBuildingById, getBuildingBySlug } from "@/lib/buildings";
import { getBuildingFromFirestoreById } from "@/lib/buildings-server";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const fromDb = await getBuildingFromFirestoreById(id);
  const building =
    fromDb ?? getBuildingBySlug(id) ?? getBuildingById(id);
  if (!building) return { title: "建築が見つかりません" };
  return {
    title: `${building.nameJa ?? building.name} | ArchiNotes`,
    description:
      building.shortDescription ??
      building.description?.slice(0, 120) ??
      `${building.architectName}設計。${building.city}。`,
  };
}

export default async function BuildingDetailPage({ params }: Props) {
  const { id } = await params;
  const fromDb = await getBuildingFromFirestoreById(id);
  const building =
    fromDb ?? getBuildingBySlug(id) ?? getBuildingById(id);
  if (!building) notFound();

  return <BuildingDetailView building={building} />;
}
