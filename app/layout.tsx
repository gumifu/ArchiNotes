import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArchiNotes | 建築を地図で発見",
  description:
    "建築を地図上で発見し、基本情報を確認できるアプリ。建築ピンを探索しよう。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="bg-background text-foreground min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
