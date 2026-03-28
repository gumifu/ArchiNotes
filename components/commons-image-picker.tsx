"use client";

import { Button } from "@/components/ui/button";
import Skeleton from "@mui/material/Skeleton";
import Image from "next/image";
import { useCallback, useState } from "react";

export type CommonsImageHit = {
  title: string;
  pageUrl: string;
  fullUrl: string;
  thumbUrl: string | null;
  mime: string | null;
};

type Props = {
  /** カバー画像 URL を設定 */
  onPickCover: (fullUrl: string) => void;
  /** ギャラリーに URL を1件追加（上限は呼び出し側で判定） */
  onPickGallery: (fullUrl: string) => void;
  canAddGallery: boolean;
  disabled?: boolean;
};

/**
 * Wikimedia Commons 検索（/api/commons-search）→ サムネからカバー／ギャラリーへ URL を入れる
 */
export function CommonsImagePicker({
  onPickCover,
  onPickGallery,
  canAddGallery,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hits, setHits] = useState<CommonsImageHit[]>([]);

  const search = useCallback(async () => {
    const query = q.trim();
    if (query.length < 2) {
      setErr("2文字以上入力してください。");
      return;
    }
    setErr(null);
    setLoading(true);
    setHits([]);
    try {
      const res = await fetch(
        `/api/commons-search?q=${encodeURIComponent(query)}&limit=12`,
      );
      const data = (await res.json()) as {
        results?: CommonsImageHit[];
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        setErr(data.message ?? data.error ?? "検索に失敗しました。");
        return;
      }
      setHits(data.results ?? []);
      if ((data.results?.length ?? 0) === 0) {
        setErr("該当する画像が見つかりませんでした。");
      }
    } catch {
      setErr("通信に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [q]);

  return (
    <div className="border-border bg-muted/20 rounded-md border border-dashed p-3">
      <button
        type="button"
        className="text-foreground flex w-full items-center justify-between text-left text-sm font-medium"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>Wikimedia Commons から画像を検索</span>
        <span className="text-muted-foreground text-xs">
          {open ? "閉じる" : "開く"}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <p className="text-muted-foreground text-xs leading-relaxed">
            ライセンスはファイルごとに異なります。利用条件・クレジット表記は Commons
            の各ファイルページで確認してください。
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              className="border-input bg-background text-foreground placeholder:text-muted-foreground min-h-9 min-w-0 flex-1 rounded-md border px-3 py-1 text-sm shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void search();
                }
              }}
              placeholder="例: National Stadium Tokyo"
              disabled={disabled || loading}
              aria-label="Commons 検索ワード"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={disabled || loading}
              onClick={() => void search()}
            >
              {loading ? "検索中…" : "検索"}
            </Button>
          </div>
          {err && !loading && (
            <p className="text-destructive text-xs" role="alert">
              {err}
            </p>
          )}
          {loading && (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <li
                  key={i}
                  className="border-border overflow-hidden rounded-md border bg-background"
                >
                  <Skeleton
                    variant="rounded"
                    animation="wave"
                    height={120}
                    className="w-full"
                  />
                  <div className="space-y-2 p-2">
                    <Skeleton
                      variant="text"
                      animation="wave"
                      sx={{ fontSize: "0.65rem" }}
                    />
                    <Skeleton variant="rounded" height={32} animation="wave" />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {!loading && hits.length > 0 && (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {hits.map((h) => (
                <li
                  key={h.title}
                  className="border-border overflow-hidden rounded-md border bg-background"
                >
                  <div className="bg-muted/40 relative aspect-4/3 w-full">
                    <Image
                      src={h.thumbUrl ?? h.fullUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 200px"
                    />
                  </div>
                  <div className="space-y-1.5 p-2">
                    <p className="text-muted-foreground line-clamp-2 text-[10px] leading-tight">
                      {h.title.replace(/^File:/, "")}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 flex-1 text-xs"
                        disabled={disabled}
                        onClick={() => onPickCover(h.fullUrl)}
                      >
                        カバーに使う
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 flex-1 text-xs"
                        disabled={disabled || !canAddGallery}
                        onClick={() => onPickGallery(h.fullUrl)}
                      >
                        追加に入れる
                      </Button>
                    </div>
                    <a
                      href={h.pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary block text-center text-[10px] font-medium underline"
                    >
                      Commons で開く
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
