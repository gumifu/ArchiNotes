/** 登録フォーム: AI 下書きで埋めた項目の横にだけ付ける控えめな表示 */

export function FormAiHint({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span
      className="text-muted-foreground ml-1.5 align-middle text-[10px] font-medium tracking-wide"
      title="AIで下書きを入れた内容です。編集するとこの表示は消えます。"
      translate="no"
    >
      AI
    </span>
  );
}
