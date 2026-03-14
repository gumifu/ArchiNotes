import { ArchitectureMap } from "@/components/architecture-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export default function HomePage() {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="border-border bg-background/95 sticky top-0 z-10 border-b px-4 py-3 backdrop-blur">
        <h1 className="text-foreground flex items-center gap-2 text-lg font-semibold">
          <MapPin className="text-primary size-5" aria-hidden />
          建築マップ
        </h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          マップ上のピンをタップして建築を探索
        </p>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 w-full flex-1">
          <ArchitectureMap />
        </div>
      </main>

      <footer className="border-border bg-card border-t px-4 py-3">
        <Card className="border-0 shadow-none">
          <CardHeader className="space-y-0 p-0">
            <CardTitle className="text-card-foreground text-sm font-medium">
              建築ピン
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-1">
            <p className="text-muted-foreground text-sm">
              ピンをタップすると建築詳細ページへ（Phase 2 でマーカー実装）
            </p>
          </CardContent>
        </Card>
      </footer>
    </div>
  );
}
