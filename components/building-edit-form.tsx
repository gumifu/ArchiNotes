"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMergedBuilding } from "@/hooks/use-merged-building";
import { saveBuildingOverride } from "@/lib/building-local-storage";
import { normalizeLocalizedText } from "@/lib/locale-text";
import type { Building } from "@/types/building";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

const inputClass =
  "border-input bg-background text-foreground placeholder:text-muted-foreground flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring";

const labelClass = "text-foreground mb-1 block text-sm font-medium";

export function BuildingEditForm({ building: initial }: { building: Building }) {
  const building = useMergedBuilding(initial);
  const router = useRouter();
  const backHref = `/buildings/${building.slug || building.id}`;

  const defaults = useMemo(
    () => ({
      name_ja: building.name.ja ?? "",
      name_en: building.name.en ?? "",
      architect_ja: building.architectName?.ja ?? "",
      architect_en: building.architectName?.en ?? "",
      architectId: building.architectId,
      country: building.country,
      city: building.city,
      ward: building.ward ?? "",
      district: building.district ?? "",
      address_ja: building.address?.ja ?? "",
      address_en: building.address?.en ?? "",
      nearestStation: building.nearestStation ?? "",
      yearCompleted:
        building.yearCompleted != null ? String(building.yearCompleted) : "",
      buildingType: building.buildingType ?? "",
      style: building.style ?? "",
      summary_ja: building.summary?.ja ?? "",
      summary_en: building.summary?.en ?? "",
      officialWebsite: building.officialWebsite ?? "",
      googleMapsUrl: building.googleMapsUrl ?? "",
      googlePlaceId: building.googlePlaceId ?? "",
      lat: String(building.location.lat),
      lng: String(building.location.lng),
    }),
    [building],
  );

  const [form, setForm] = useState(defaults);

  const set =
    (key: keyof typeof defaults) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
    };

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.name_ja.trim() && !form.name_en.trim()) {
        alert("名称を日本語または英語のいずれかで入力してください。");
        return;
      }
      const lat = Number.parseFloat(form.lat);
      const lng = Number.parseFloat(form.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        alert("緯度・経度は有効な数値で入力してください。");
        return;
      }
      const year =
        form.yearCompleted.trim() === ""
          ? null
          : Number.parseInt(form.yearCompleted, 10);
      if (form.yearCompleted.trim() !== "" && !Number.isFinite(year)) {
        alert("完成年は数値で入力してください。");
        return;
      }

      const patch: Partial<Building> = {
        name: normalizeLocalizedText({
          ja: form.name_ja.trim(),
          en: form.name_en.trim(),
        }),
        architectName: normalizeLocalizedText({
          ja: form.architect_ja.trim(),
          en: form.architect_en.trim(),
        }),
        architectId: form.architectId.trim(),
        country: form.country.trim(),
        city: form.city.trim(),
        ward: form.ward.trim() || undefined,
        district: form.district.trim() || undefined,
        address: normalizeLocalizedText({
          ja: form.address_ja.trim(),
          en: form.address_en.trim(),
        }),
        nearestStation: form.nearestStation.trim() || undefined,
        yearCompleted: year,
        buildingType: form.buildingType.trim() || undefined,
        style: form.style.trim() || undefined,
        summary: normalizeLocalizedText({
          ja: form.summary_ja.trim(),
          en: form.summary_en.trim(),
        }),
        officialWebsite: form.officialWebsite.trim() || undefined,
        googleMapsUrl: form.googleMapsUrl.trim() || undefined,
        googlePlaceId: form.googlePlaceId.trim() || undefined,
        location: { lat, lng },
      };

      saveBuildingOverride(building.id, patch);
      router.push(backHref);
      router.refresh();
    },
    [form, building.id, backHref, router],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="archinotes-max-w-form space-y-6 pb-12"
    >
      <p className="text-muted-foreground text-sm">
        変更はこのブラウザの localStorage に保存されます（開発・個人向け）。
      </p>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">名称・建築家</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className={labelClass} htmlFor="name_ja">
              名称（日本語）
            </label>
            <input
              id="name_ja"
              className={inputClass}
              value={form.name_ja}
              onChange={set("name_ja")}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="name_en">
              名称（英語）
            </label>
            <input
              id="name_en"
              className={inputClass}
              value={form.name_en}
              onChange={set("name_en")}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="architect_ja">
              建築家（日本語）
            </label>
            <input
              id="architect_ja"
              className={inputClass}
              value={form.architect_ja}
              onChange={set("architect_ja")}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="architect_en">
              建築家（英語）
            </label>
            <input
              id="architect_en"
              className={inputClass}
              value={form.architect_en}
              onChange={set("architect_en")}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="architectId">
              建築家 ID（内部用）
            </label>
            <input
              id="architectId"
              className={inputClass}
              value={form.architectId}
              onChange={set("architectId")}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">所在地</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className={labelClass} htmlFor="country">
              国
            </label>
            <input
              id="country"
              className={inputClass}
              value={form.country}
              onChange={set("country")}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="city">
              都市
            </label>
            <input
              id="city"
              className={inputClass}
              value={form.city}
              onChange={set("city")}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="ward">
              区・地域
            </label>
            <input
              id="ward"
              className={inputClass}
              value={form.ward}
              onChange={set("ward")}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="district">
              地区（任意）
            </label>
            <input
              id="district"
              className={inputClass}
              value={form.district}
              onChange={set("district")}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="address_ja">
              住所（日本語・表示用）
            </label>
            <input
              id="address_ja"
              className={inputClass}
              value={form.address_ja}
              onChange={set("address_ja")}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="address_en">
              住所（英語・表示用）
            </label>
            <input
              id="address_en"
              className={inputClass}
              value={form.address_en}
              onChange={set("address_en")}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="nearestStation">
              最寄り駅
            </label>
            <input
              id="nearestStation"
              className={inputClass}
              value={form.nearestStation}
              onChange={set("nearestStation")}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="lat">
                緯度
              </label>
              <input
                id="lat"
                className={inputClass}
                value={form.lat}
                onChange={set("lat")}
                required
                inputMode="decimal"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="lng">
                経度
              </label>
              <input
                id="lng"
                className={inputClass}
                value={form.lng}
                onChange={set("lng")}
                required
                inputMode="decimal"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">建築データ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className={labelClass} htmlFor="yearCompleted">
              完成年
            </label>
            <input
              id="yearCompleted"
              className={inputClass}
              value={form.yearCompleted}
              onChange={set("yearCompleted")}
              inputMode="numeric"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="buildingType">
              用途
            </label>
            <input
              id="buildingType"
              className={inputClass}
              value={form.buildingType}
              onChange={set("buildingType")}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="style">
              様式
            </label>
            <input
              id="style"
              className={inputClass}
              value={form.style}
              onChange={set("style")}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="summary_ja">
              概要（日本語）
            </label>
            <textarea
              id="summary_ja"
              className={`${inputClass} min-h-[100px] py-2`}
              value={form.summary_ja}
              onChange={set("summary_ja")}
              rows={5}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="summary_en">
              概要（英語）
            </label>
            <textarea
              id="summary_en"
              className={`${inputClass} min-h-[100px] py-2`}
              value={form.summary_en}
              onChange={set("summary_en")}
              rows={5}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">リンク・Google</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className={labelClass} htmlFor="officialWebsite">
              公式サイト URL
            </label>
            <input
              id="officialWebsite"
              className={inputClass}
              value={form.officialWebsite}
              onChange={set("officialWebsite")}
              type="url"
              placeholder="https://"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="googleMapsUrl">
              Google マップ URL（任意）
            </label>
            <input
              id="googleMapsUrl"
              className={inputClass}
              value={form.googleMapsUrl}
              onChange={set("googleMapsUrl")}
              type="url"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="googlePlaceId">
              Google Place ID
            </label>
            <input
              id="googlePlaceId"
              className={inputClass}
              value={form.googlePlaceId}
              onChange={set("googlePlaceId")}
              placeholder="ChIJ..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button type="submit">保存して詳細へ</Button>
        <Button type="button" variant="outline" className="shadow-none" asChild>
          <Link href={backHref}>キャンセル</Link>
        </Button>
      </div>
    </form>
  );
}
