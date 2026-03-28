"use client";

import { Button } from "@/components/ui/button";
import { buildingToMvpFormValues } from "@/lib/building-mvp";
import { MAP_DEFAULT_CENTER } from "@/lib/constants";
import type { Building } from "@/types/building";
import {
  APIProvider,
  AdvancedMarker,
  Map,
  type MapMouseEvent,
} from "@vis.gl/react-google-maps";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const inputClass =
  "border-input bg-background text-foreground placeholder:text-muted-foreground flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring";

const labelClass = "text-foreground mb-1 block text-sm font-medium";

const DEFAULT_MAP_ID = "DEMO_MAP_ID";

export type BuildingMvpFormProps = {
  mode: "create" | "edit";
  buildingId?: string;
  initialBuilding?: Building;
};

export function BuildingMvpForm({
  mode,
  buildingId,
  initialBuilding,
}: BuildingMvpFormProps) {
  const router = useRouter();
  const defaults = useMemo(() => {
    if (mode === "edit" && initialBuilding) {
      return buildingToMvpFormValues(initialBuilding);
    }
    return {
      name: "",
      name_en: "",
      address: "",
      lat: String(MAP_DEFAULT_CENTER.lat),
      lng: String(MAP_DEFAULT_CENTER.lng),
      architect_name: "",
      year: "",
      description: "",
      cover_image: "",
      place_id: "",
    };
  }, [mode, initialBuilding]);

  const [form, setForm] = useState(defaults);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(defaults);
  }, [defaults]);

  const set =
    (key: keyof typeof defaults) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
    };

  const latNum = Number.parseFloat(form.lat);
  const lngNum = Number.parseFloat(form.lng);
  const markerPos =
    Number.isFinite(latNum) && Number.isFinite(lngNum)
      ? { lat: latNum, lng: lngNum }
      : MAP_DEFAULT_CENTER;

  const mapCenter = markerPos;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const handleMapClick = useCallback((e: MapMouseEvent) => {
    const ll = e.detail.latLng;
    if (!ll) return;
    setForm((f) => ({
      ...f,
      lat: String(ll.lat),
      lng: String(ll.lng),
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const lat = Number.parseFloat(form.lat);
      const lng = Number.parseFloat(form.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setError("緯度・経度を入力するか、地図をクリックしてください。");
        return;
      }
      let year: number | null = null;
      if (form.year.trim() !== "") {
        const y = Number.parseInt(form.year, 10);
        if (!Number.isFinite(y)) {
          setError("完成年は整数で入力してください。");
          return;
        }
        year = y;
      }

      const body = {
        name: form.name.trim(),
        name_en: form.name_en.trim() || undefined,
        lat,
        lng,
        address: form.address.trim(),
        place_id: form.place_id.trim() || undefined,
        architect_name: form.architect_name.trim() || undefined,
        year,
        description: form.description.trim() || undefined,
        cover_image: form.cover_image.trim() || undefined,
      };

      if (!body.name) {
        setError("名称を入力してください。");
        return;
      }

      setSubmitting(true);
      try {
        const url =
          mode === "create"
            ? "/api/buildings"
            : `/api/buildings/${buildingId}`;
        const res = await fetch(url, {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          id?: string;
        };
        if (!res.ok) {
          if (res.status === 503 && data.error === "firebase_admin_not_configured") {
            setError(
              "サーバーに FIREBASE_SERVICE_ACCOUNT_JSON が未設定です。.env.local を確認してください。",
            );
          } else {
            setError(data.error ?? `保存に失敗しました (${res.status})`);
          }
          return;
        }
        const id = mode === "create" ? data.id : buildingId;
        if (!id) {
          setError("レスポンスに id がありません。");
          return;
        }
        router.push(`/buildings/${id}`);
        router.refresh();
      } catch {
        setError("通信に失敗しました。");
      } finally {
        setSubmitting(false);
      }
    },
    [form, mode, buildingId, router],
  );

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-5 pb-12">
      {error && (
        <p className="text-destructive bg-destructive/10 rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <div>
        <label className={labelClass} htmlFor="mvp-name">
          名称 <span className="text-destructive">*</span>
        </label>
        <input
          id="mvp-name"
          className={inputClass}
          value={form.name}
          onChange={set("name")}
          required
          autoComplete="off"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="mvp-name-en">
          名称（英語など・任意）
        </label>
        <input
          id="mvp-name-en"
          className={inputClass}
          value={form.name_en}
          onChange={set("name_en")}
          autoComplete="off"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="mvp-address">
          住所（任意・推奨）
        </label>
        <input
          id="mvp-address"
          className={inputClass}
          value={form.address}
          onChange={set("address")}
          placeholder="例: 東京都渋谷区..."
          autoComplete="street-address"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="mvp-lat">
            緯度 <span className="text-destructive">*</span>
          </label>
          <input
            id="mvp-lat"
            className={inputClass}
            value={form.lat}
            onChange={set("lat")}
            inputMode="decimal"
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="mvp-lng">
            経度 <span className="text-destructive">*</span>
          </label>
          <input
            id="mvp-lng"
            className={inputClass}
            value={form.lng}
            onChange={set("lng")}
            inputMode="decimal"
            required
          />
        </div>
      </div>

      <div>
        <p className={labelClass}>位置（地図をクリックして緯度経度を指定）</p>
        {!apiKey ? (
          <p className="text-muted-foreground text-sm">
            Google Maps API キーが未設定のため地図を表示できません。緯度・経度を直接入力してください。
          </p>
        ) : (
          <div className="h-[220px] w-full overflow-hidden rounded-md border">
            <APIProvider apiKey={apiKey}>
              <Map
                mapId={
                  process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? DEFAULT_MAP_ID
                }
                center={mapCenter}
                defaultZoom={14}
                gestureHandling="greedy"
                disableDefaultUI
                onClick={handleMapClick}
                style={{ width: "100%", height: "100%" }}
              >
                <AdvancedMarker position={markerPos} />
              </Map>
            </APIProvider>
          </div>
        )}
      </div>

      <div>
        <label className={labelClass} htmlFor="mvp-architect">
          建築家（任意）
        </label>
        <input
          id="mvp-architect"
          className={inputClass}
          value={form.architect_name}
          onChange={set("architect_name")}
          autoComplete="off"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="mvp-year">
          完成年（任意）
        </label>
        <input
          id="mvp-year"
          className={inputClass}
          value={form.year}
          onChange={set("year")}
          inputMode="numeric"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="mvp-desc">
          説明（任意）
        </label>
        <textarea
          id="mvp-desc"
          className={`${inputClass} min-h-[100px] py-2`}
          value={form.description}
          onChange={set("description")}
          rows={4}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="mvp-cover">
          カバー画像 URL（任意）
        </label>
        <input
          id="mvp-cover"
          className={inputClass}
          type="url"
          value={form.cover_image}
          onChange={set("cover_image")}
          placeholder="https://..."
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="mvp-place-id">
          Google Place ID（任意・Places 本文は保存しません）
        </label>
        <input
          id="mvp-place-id"
          className={inputClass}
          value={form.place_id}
          onChange={set("place_id")}
          autoComplete="off"
        />
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "保存中…" : "保存"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/">キャンセル</Link>
        </Button>
      </div>
    </form>
  );
}
