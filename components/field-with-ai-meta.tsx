import { AiSourceInfo } from "@/components/ai-source-info";
import { AiSuggestionBadge } from "@/components/ai-suggestion-badge";
import type { AiMeta } from "@/types/building-ai-meta";
import type { ReactNode } from "react";

type Props = {
  label: string;
  /** 文字列または複数行ブロック */
  value: ReactNode;
  aiMeta?: AiMeta | null;
  /**
   * stacked: ラベル上・下に値＋バッジ（カード）
   * inline: 横並え（リスト行）
   * block: ラベル行にバッジ、下に本文（複数行）
   */
  variant?: "stacked" | "inline" | "block";
  /** block 時、見出しラベルを隠してバッジ行のみにする（セクション見出しと重複させない用） */
  hideLabel?: boolean;
};

/**
 * 項目ラベル・値・（AI時のみ）AI提案バッジと出典 i マーク
 */
export function FieldWithAiMeta({
  label,
  value,
  aiMeta,
  variant = "stacked",
  hideLabel = false,
}: Props) {
  const showAi = aiMeta?.isAiSuggested === true;

  const chrome = showAi ? (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <AiSuggestionBadge />
      <AiSourceInfo
        sourceName={aiMeta?.sourceName}
        sourceUrl={aiMeta?.sourceUrl}
        note={aiMeta?.note}
      />
    </span>
  ) : null;

  if (variant === "inline") {
    return (
      <li className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-foreground font-medium">{label}:</span>
        <span className="text-foreground">{value}</span>
        {chrome}
      </li>
    );
  }

  if (variant === "block") {
    return (
      <div className="space-y-2">
        {(showAi || !hideLabel) && (
          <div className="flex flex-wrap items-center gap-2">
            {!hideLabel && (
              <span className="text-foreground font-medium">{label}</span>
            )}
            {chrome}
          </div>
        )}
        <div className="text-foreground">{value}</div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
        <div className="text-foreground min-w-0 text-sm font-medium">{value}</div>
        {chrome}
      </div>
    </div>
  );
}
