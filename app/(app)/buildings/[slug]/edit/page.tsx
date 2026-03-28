import { BuildingEditForm } from "@/components/building-edit-form";
import { BuildingMvpForm } from "@/components/building-mvp-form";
import { Button } from "@/components/ui/button";
import {
  permanentRedirectToCanonicalBuildingPath,
  resolveBuildingFromUrlSegment,
} from "@/lib/building-resolve";
import { getBuildingFromFirestoreById } from "@/lib/buildings-server";
import { DEFAULT_LOCALE, pickLocalized } from "@/lib/locale-text";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export default async function BuildingEditPage({ params }: Props) {
  const { slug: param } = await params;
  const building = await resolveBuildingFromUrlSegment(param);
  if (!building) notFound();

  permanentRedirectToCanonicalBuildingPath(param, building, {
    suffix: "/edit",
  });

  const title = pickLocalized(building.name, DEFAULT_LOCALE);

  const fromDb = await getBuildingFromFirestoreById(building.id);

  return (
    <div className="py-6">
      <Button variant="ghost" size="sm" className="mb-4 shadow-none" asChild>
        <Link
          href={`/buildings/${building.slug || building.id}`}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          詳細に戻る
        </Link>
      </Button>
      <h1 className="text-foreground mb-1 text-lg font-semibold">
        建築情報の編集
      </h1>
      <p className="text-muted-foreground mb-6 text-sm">{title}</p>

      {fromDb ? (
        <BuildingMvpForm
          mode="edit"
          buildingId={building.id}
          initialBuilding={building}
        />
      ) : (
        <>
          <p className="text-muted-foreground mb-4 text-sm">
            この建築は Firestore に未登録です。サーバー保存は
            「建築を登録」から新規作成するか、下のローカル編集をご利用ください。
          </p>
          <BuildingEditForm building={building} />
        </>
      )}
    </div>
  );
}
