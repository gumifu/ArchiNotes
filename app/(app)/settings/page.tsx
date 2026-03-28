import { SettingsPageClient } from "@/components/settings-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "設定 | ArchiNotes",
  description: "表示言語（日本語 / 英語）の切り替え",
};

export default function SettingsPage() {
  return <SettingsPageClient />;
}
