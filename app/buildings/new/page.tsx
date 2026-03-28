import { BuildingMvpForm } from "@/components/building-mvp-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = {
  title: "建築を登録 | ArchiNotes",
};

export default function NewBuildingPage() {
  return (
    <div className="bg-background min-h-screen px-4 py-6">
      <Button variant="ghost" size="sm" className="mb-4 shadow-none" asChild>
        <Link href="/" className="gap-2">
          <ArrowLeft className="size-4" />
          マップに戻る
        </Link>
      </Button>
      <h1 className="text-foreground mb-1 text-lg font-semibold">建築を登録</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        必須: 名称・緯度・経度。検索から Places
        を選ぶと初期値が入ります（本文は DB に保存しません。確認のうえ保存してください）。
      </p>
      <Suspense
        fallback={
          <p className="text-muted-foreground text-sm">読み込み中…</p>
        }
      >
        <BuildingMvpForm mode="create" />
      </Suspense>
    </div>
  );
}
