"use client";

import { formatPlaceInfoVerifiedDateLine } from "@/lib/place-info-freshness";
import type { Building } from "@/types/building";
import {
  AlertTriangle,
  Clock,
  Layers,
  MapPin,
  Pencil,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

/** Google Maps 系 UI のティール（アイコン） */
const GMAPS_TEAL = "text-[#118D97]";
const GMAPS_LINK = "text-[#1a73e8]";

type PlaceDetailsApi = {
  regularOpeningHours?: {
    weekdayDescriptions?: string[];
    openNow?: boolean;
  } | null;
  currentOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  } | null;
  primaryType?: string;
  primaryTypeDisplayName?: { text?: string } | null;
  types?: string[];
  businessStatus?: string;
  containingPlaces?: Array<{
    displayName?: { text?: string };
    name?: string;
    id?: string;
  }>;
  googleMapsUri?: string;
  typeValidation?: {
    level: "ok" | "warning" | "mismatch";
    matchedCore?: string[];
    message?: string;
  };
  cached?: boolean;
  error?: string;
  message?: string;
};

function businessStatusJa(s: string | undefined): string {
  switch (s) {
    case "OPERATIONAL":
      return "営業中";
    case "CLOSED_TEMPORARILY":
      return "一時休業";
    case "CLOSED_PERMANENTLY":
      return "閉業";
    default:
      return s ?? "—";
  }
}

function PlaceInfoAttributionNotice({ building }: { building: Building }) {
  return (
    <div className="text-muted-foreground space-y-1.5 text-xs leading-relaxed">
      <p>{formatPlaceInfoVerifiedDateLine(building.placeInfoVerifiedAt)}</p>
      <p>一部情報は Google Places を参照しています。</p>
      <p>現地訪問前に公式情報もご確認ください。</p>
    </div>
  );
}

function Row({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-gray-100 py-3.5 last:border-b-0">
      <div
        className={`${GMAPS_TEAL} flex h-6 w-6 shrink-0 items-center justify-center`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1 text-[15px] leading-snug text-gray-900">
        {children}
      </div>
    </div>
  );
}

export function BuildingGooglePlaceInfo({ building }: { building: Building }) {
  const [data, setData] = useState<PlaceDetailsApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const placeId = building.googlePlaceId?.trim();
  const editHref = `/buildings/${building.slug || building.id}/edit`;

  useEffect(() => {
    if (!placeId) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErr(null);
    fetch(`/api/places-details?placeId=${encodeURIComponent(placeId)}`)
      .then(async (r) => {
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { message?: string };
          throw new Error(j.message ?? `HTTP ${r.status}`);
        }
        return r.json() as Promise<PlaceDetailsApi>;
      })
      .then((j) => {
        if (!cancelled) setData(j);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setErr(e instanceof Error ? e.message : "取得に失敗しました");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [placeId]);

  if (!placeId) return null;

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Google 情報を読み込み中…</p>
        <PlaceInfoAttributionNotice building={building} />
      </div>
    );
  }

  if (err) {
    return (
      <div className="space-y-4">
        <p className="text-destructive text-sm wrap-break-word">
          Google 情報の取得に失敗しました: {err}
        </p>
        <PlaceInfoAttributionNotice building={building} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Google 情報を表示できません。</p>
        <PlaceInfoAttributionNotice building={building} />
      </div>
    );
  }

  const mapsHref = data.googleMapsUri ?? building.googleMapsUrl?.trim();
  const openNow =
    data.currentOpeningHours?.openNow ?? data.regularOpeningHours?.openNow;
  const weekdayLines =
    data.regularOpeningHours?.weekdayDescriptions ??
    data.currentOpeningHours?.weekdayDescriptions;

  const tv = data.typeValidation;
  const address = building.address?.trim();

  return (
    <div className="overflow-hidden rounded-md border border-gray-200 bg-background">
      {tv && tv.level !== "ok" && tv.message && (
        <div className="flex gap-2 border-b border-amber-100 bg-amber-50/90 px-3 py-3 text-sm text-gray-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <span>{tv.message}</span>
        </div>
      )}

      <div className="px-3">
        {address && (
          <Row icon={<MapPin className="size-5 stroke-[1.75]" />}>
            <span className="text-gray-900">{address}</span>
          </Row>
        )}

        {data.businessStatus && (
          <Row icon={<Tag className="size-5 stroke-[1.75]" />}>
            <div className="space-y-0.5">
              <p>
                <span className="font-medium text-gray-900">営業状態</span>
              </p>
              <p className="text-gray-700">
                {data.businessStatus === "OPERATIONAL" ? (
                  <span className="font-medium text-green-600">
                    {businessStatusJa(data.businessStatus)}
                  </span>
                ) : (
                  <span>{businessStatusJa(data.businessStatus)}</span>
                )}
                {openNow !== undefined && (
                  <span className="text-gray-600">
                    {" "}
                    · 現在:{" "}
                    {openNow
                      ? "開いている可能性が高い"
                      : "閉じている可能性が高い"}
                  </span>
                )}
              </p>
            </div>
          </Row>
        )}

        {(data.primaryTypeDisplayName?.text ||
          data.primaryType ||
          data.types) && (
          <Row icon={<Tag className="size-5 stroke-[1.75]" />}>
            <div className="space-y-1">
              <p className="font-medium text-gray-900">カテゴリ</p>
              <p className="text-gray-700">
                {data.primaryTypeDisplayName?.text ?? data.primaryType ?? "—"}
              </p>
              {data.types && data.types.length > 0 && (
                <p className="text-xs text-gray-500">
                  {data.types.join(" · ")}
                </p>
              )}
            </div>
          </Row>
        )}

        {weekdayLines && weekdayLines.length > 0 && (
          <Row icon={<Clock className="size-5 stroke-[1.75]" />}>
            <div className="space-y-1">
              <p className="font-medium text-gray-900">営業時間</p>
              <ul className="space-y-1 text-gray-700">
                {weekdayLines.map((line, i) => (
                  <li key={i} className="text-sm">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </Row>
        )}

        {data.containingPlaces && data.containingPlaces.length > 0 && (
          <Row icon={<Layers className="size-5 stroke-[1.75]" />}>
            <div className="space-y-1">
              <p className="font-medium text-gray-900">所在施設</p>
              <ul className="list-inside list-disc text-gray-700">
                {data.containingPlaces.map((p, i) => (
                  <li key={i} className="text-sm">
                    {p.displayName?.text ?? p.name ?? p.id}
                  </li>
                ))}
              </ul>
            </div>
          </Row>
        )}
      </div>

      <div className="border-border border-t bg-background px-3 py-3">
        <Link
          href={editHref}
          className="border-border text-foreground mb-3 flex w-full items-center justify-center gap-2 rounded-md border bg-muted/40 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted/70"
        >
          <Pencil className="size-4" aria-hidden />
          建築情報を編集
        </Link>

        {mapsHref ? (
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`${GMAPS_LINK} flex w-full items-center justify-center gap-2 py-2 text-sm font-medium hover:underline`}
          >
            Google マップで開く
          </a>
        ) : null}

        <div className="mt-4 border-t border-gray-100 pt-4">
          <PlaceInfoAttributionNotice building={building} />
        </div>
      </div>
    </div>
  );
}
