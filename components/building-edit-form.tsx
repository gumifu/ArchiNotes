"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMergedBuilding } from "@/hooks/use-merged-building";
import { saveBuildingOverride } from "@/lib/building-local-storage";
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
      name: building.name,
      nameJa: building.nameJa ?? "",
      architectName: building.architectName,
      architectId: building.architectId,
      country: building.country,
      city: building.city,
      ward: building.ward ?? "",
      district: building.district ?? "",
      address: building.address ?? "",
      nearestStation: building.nearestStation ?? "",
      yearCompleted:
        building.yearCompleted != null ? String(building.yearCompleted) : "",
      buildingType: building.buildingType ?? "",
      style: building.style ?? "",
      shortDescription: building.shortDescription ?? "",
      description: building.description ?? "",
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
        name: form.name.trim(),
        nameJa: form.nameJa.trim() || undefined,
        architectName: form.architectName.trim(),
        architectId: form.architectId.trim(),
        country: form.country.trim(),
        city: form.city.trim(),
        ward: form.ward.trim() || undefined,
        district: form.district.trim() || undefined,
        address: form.address.trim() || undefined,
        nearestStation: form.nearestStation.trim() || undefined,
        yearCompleted: year,
        buildingType: form.buildingType.trim() || undefined,
        style: form.style.trim() || undefined,
        shortDescription: form.shortDescription.trim() || undefined,
        description: form.description.trim() || undefined,
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
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6 pb-12">
      <p className="text-muted-foreground text-sm">
        変更はこのブラウザの localStorage に保存されます（開発・個人向け）。
      </p>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">名称・建築家</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className={labelClass} htmlFor="name">
              名称（英語など）
            </label>
            <input
              id="name"
              className={inputClass}
              value={form.name}
              onChange={set("name")}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="nameJa">
              名称（日本語）
            </label>
            <input
              id="nameJa"
              className={inputClass}
              value={form.nameJa}
              onChange={set("nameJa")}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="architectName">
              建築家
            </label>
            <input
              id="architectName"
              className={inputClass}
              value={form.architectName}
              onChange={set("architectName")}
              required
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
            <label className={labelClass} htmlFor="address">
              住所（表示用）
            </label>
            <input
              id="address"
              className={inputClass}
              value={form.address}
              onChange={set("address")}
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
            <label className={labelClass} htmlFor="shortDescription">
              短い説明
            </label>
            <textarea
              id="shortDescription"
              className={`${inputClass} min-h-[72px] py-2`}
              value={form.shortDescription}
              onChange={set("shortDescription")}
              rows={3}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="description">
              説明
            </label>
            <textarea
              id="description"
              className={`${inputClass} min-h-[120px] py-2`}
              value={form.description}
              onChange={set("description")}
              rows={6}
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
