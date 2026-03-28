"use client";

import type { AiMeta } from "@/types/building-ai-meta";
import { Info } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

type Props = Pick<AiMeta, "sourceName" | "sourceUrl" | "note">;

/**
 * i アイコン。クリックで出典説明のポップオーバー（モバイルでも押しやすい最小タップ領域）
 */
export function AiSourceInfo({ sourceName, sourceUrl, note }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const sourceLabel = sourceName?.trim() || "出典あり";

  return (
    <div className="relative inline-flex shrink-0" ref={rootRef}>
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground border-border flex min-h-9 min-w-9 items-center justify-center rounded-md border border-transparent hover:border-current/20"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <Info className="size-4" aria-hidden />
        <span className="sr-only">AI提案の出典と注意を表示</span>
      </button>
      {open ? (
        <div
          id={panelId}
          role="dialog"
          className="border-border bg-background text-foreground absolute top-full left-1/2 z-50 mt-1 w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-md border p-3 text-left text-xs leading-relaxed shadow-md sm:left-0 sm:translate-x-0"
        >
          <p>この項目はAIが提案した情報です。</p>
          <p className="mt-1.5">内容が不正確な場合があります。</p>
          <p className="text-muted-foreground mt-2">
            出典: {sourceLabel}
          </p>
          {note?.trim() ? (
            <p className="text-muted-foreground mt-1.5">{note.trim()}</p>
          ) : null}
          {sourceUrl?.trim() ? (
            <a
              href={sourceUrl.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary mt-2 inline-block font-medium underline"
            >
              出典を見る
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
