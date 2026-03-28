/**
 * マップ以外のページ: 読みやすい行長のため max-w-3xl（約 48rem）
 */
export default function ReadingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-background min-h-screen">
      <div className="archinotes-reading-shell">{children}</div>
    </div>
  );
}
