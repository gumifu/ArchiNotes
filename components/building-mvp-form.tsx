"use client";

import { Button } from "@/components/ui/button";
import {
  buildingToMvpFormValues,
  MVP_GALLERY_MAX_EXTRA,
} from "@/lib/building-mvp";
import { FormAiHint } from "@/components/form-ai-hint";
import { CommonsImagePicker } from "@/components/commons-image-picker";
import {
  clearBuildingRegistrationDraft,
  loadBuildingRegistrationDraft,
  saveBuildingRegistrationDraft,
} from "@/lib/building-registration-draft";
import { createAiDraftMeta, pruneBuildingAiMeta } from "@/lib/building-ai-meta";
import { useUiLocale } from "@/hooks/use-ui-locale";
import { appUiStrings } from "@/lib/app-ui-strings";
import { clearBuildingOverride } from "@/lib/building-local-storage";
import { MAP_DEFAULT_CENTER } from "@/lib/constants";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import type { BuildingAiMeta } from "@/types/building-ai-meta";
import type { Building, BuildingRawSource } from "@/types/building";
import {
  APIProvider,
  AdvancedMarker,
  Map,
  type MapMouseEvent,
} from "@vis.gl/react-google-maps";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export type MvpFormFields = {
  name_ja: string;
  name_en: string;
  address_ja: string;
  address_en: string;
  lat: string;
  lng: string;
  architect_ja: string;
  architect_en: string;
  year: string;
  summary_ja: string;
  summary_en: string;
  cover_image: string;
  gallery_urls: string[];
  place_id: string;
};

const emptyCreateForm = (): MvpFormFields => ({
  name_ja: "",
  name_en: "",
  address_ja: "",
  address_en: "",
  lat: String(MAP_DEFAULT_CENTER.lat),
  lng: String(MAP_DEFAULT_CENTER.lng),
  architect_ja: "",
  architect_en: "",
  year: "",
  summary_ja: "",
  summary_en: "",
  cover_image: "",
  gallery_urls: [],
  place_id: "",
});

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
  const searchParams = useSearchParams();
  const uiLocale = useUiLocale();
  const ui = appUiStrings(uiLocale);

  const defaults = useMemo(() => {
    if (mode === "edit" && initialBuilding) {
      return buildingToMvpFormValues(initialBuilding);
    }
    return emptyCreateForm();
  }, [mode, initialBuilding]);

  const [form, setForm] = useState<MvpFormFields>(defaults);
  const [formAiMeta, setFormAiMeta] = useState<BuildingAiMeta>({});
  const [draftLoaded, setDraftLoaded] = useState(mode !== "create");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefillStatus, setPrefillStatus] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [aiDrafting, setAiDrafting] = useState(false);
  const [aiDraftNote, setAiDraftNote] = useState<string | null>(null);
  const [deletingBuilding, setDeletingBuilding] = useState(false);
  const [rawSourceDraft, setRawSourceDraft] = useState<BuildingRawSource | null>(
    null,
  );

  useEffect(() => {
    if (mode === "edit" && initialBuilding) {
      setForm(buildingToMvpFormValues(initialBuilding));
      setFormAiMeta(initialBuilding.aiMeta ?? {});
      setRawSourceDraft(initialBuilding.rawSource ?? null);
    }
  }, [mode, initialBuilding]);

  useEffect(() => {
    if (mode !== "create") return;
    const d = loadBuildingRegistrationDraft(MVP_GALLERY_MAX_EXTRA);
    if (d) {
      const { aiMeta: draftAi, ...draftRest } = d;
      setForm((prev) => ({ ...prev, ...draftRest }));
      if (draftAi) setFormAiMeta(draftAi);
    }
    setDraftLoaded(true);
  }, [mode]);

  useEffect(() => {
    if (mode !== "create" || !draftLoaded) return;
    const id = window.setTimeout(() => {
      saveBuildingRegistrationDraft({ ...form, aiMeta: formAiMeta });
    }, 800);
    return () => window.clearTimeout(id);
  }, [form, formAiMeta, mode, draftLoaded]);

  const placeIdFromUrl = searchParams.get("placeId")?.trim() ?? "";

  useEffect(() => {
    if (mode !== "create" || !placeIdFromUrl) {
      if (mode === "create" && !placeIdFromUrl) setPrefillStatus("idle");
      return;
    }
    let cancelled = false;
    setPrefillStatus("loading");
    fetch(
      `/api/places-prefill?placeId=${encodeURIComponent(placeIdFromUrl)}`,
    )
      .then(async (r) => {
        if (!r.ok) throw new Error("prefill_failed");
        return r.json() as Promise<{
          place_id: string;
          name: { ja: string; en: string };
          address: { ja: string; en: string };
          lat: number;
          lng: number;
          rawSource: BuildingRawSource;
        }>;
      })
      .then((data) => {
        if (cancelled) return;
        setForm((prev) => ({
          ...prev,
          name_ja: data.name.ja,
          name_en: data.name.en,
          address_ja: data.address.ja,
          address_en: data.address.en,
          lat: String(data.lat),
          lng: String(data.lng),
          place_id: data.place_id,
        }));
        setRawSourceDraft(data.rawSource);
        setPrefillStatus("done");
      })
      .catch(() => {
        if (cancelled) return;
        setPrefillStatus("error");
        setForm((prev) => ({ ...prev, place_id: placeIdFromUrl }));
      });
    return () => {
      cancelled = true;
    };
  }, [mode, placeIdFromUrl]);

  type TextFieldKey = keyof Omit<MvpFormFields, "gallery_urls">;

  const clearFieldAiMeta = useCallback((key: TextFieldKey) => {
    const map: Partial<Record<TextFieldKey, keyof BuildingAiMeta>> = {
      name_en: "nameEn",
      architect_ja: "architectName",
      architect_en: "architectName",
      year: "year",
      summary_ja: "summary",
      summary_en: "summary",
    };
    const metaKey = map[key];
    if (!metaKey) return;
    setFormAiMeta((m) => {
      const next = { ...m };
      delete next[metaKey];
      return next;
    });
  }, []);

  const set =
    (key: TextFieldKey) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
    };

  const setTracked =
    (key: TextFieldKey) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      clearFieldAiMeta(key);
    };

  const setGalleryUrl = useCallback((index: number, value: string) => {
    setForm((f) => {
      const next = [...f.gallery_urls];
      next[index] = value;
      return { ...f, gallery_urls: next };
    });
  }, []);

  const addGalleryRow = useCallback(() => {
    setForm((f) => {
      if (f.gallery_urls.length >= MVP_GALLERY_MAX_EXTRA) return f;
      return { ...f, gallery_urls: [...f.gallery_urls, ""] };
    });
  }, []);

  const removeGalleryRow = useCallback((index: number) => {
    setForm((f) => ({
      ...f,
      gallery_urls: f.gallery_urls.filter((_, i) => i !== index),
    }));
  }, []);

  const handleClearDraft = useCallback(() => {
    clearBuildingRegistrationDraft();
    setForm(emptyCreateForm());
    setFormAiMeta({});
    setRawSourceDraft(null);
  }, []);

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

  const handleAiDraft = useCallback(async () => {
    setError(null);
    setAiDraftNote(null);
    if (!form.name_ja.trim() && !form.name_en.trim()) {
      setError("名称（日本語または英語）を入力してから「AIで下書き」を使えます。");
      return;
    }
    const before = {
      name_en: form.name_en,
      architect_ja: form.architect_ja,
      architect_en: form.architect_en,
      year: form.year,
      summary_ja: form.summary_ja,
      summary_en: form.summary_en,
    };
    setAiDrafting(true);
    try {
      const lat = Number.parseFloat(form.lat);
      const lng = Number.parseFloat(form.lng);
      const res = await fetch("/api/buildings/ai-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name_ja: form.name_ja.trim(),
          name_en: form.name_en.trim() || undefined,
          address_ja: form.address_ja.trim() || undefined,
          address_en: form.address_en.trim() || undefined,
          place_id: form.place_id.trim() || undefined,
          lat: Number.isFinite(lat) ? lat : undefined,
          lng: Number.isFinite(lng) ? lng : undefined,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        draft?: {
          architect_ja?: string | null;
          architect_en?: string | null;
          year?: number | null;
          summary_ja?: string | null;
          summary_en?: string | null;
          name_en?: string | null;
        };
        disclaimer?: string;
      };
      if (!res.ok) {
        setError(
          data.message ??
            data.error ??
            `AI 下書きに失敗しました（${res.status}）`,
        );
        return;
      }
      const d = data.draft;
      if (!d) {
        setError("AI から有効な下書きが返りませんでした。");
        return;
      }
      setForm((f) => ({
        ...f,
        name_en: f.name_en.trim()
          ? f.name_en
          : d.name_en != null && String(d.name_en).trim() !== ""
            ? String(d.name_en)
            : f.name_en,
        architect_ja: f.architect_ja.trim()
          ? f.architect_ja
          : d.architect_ja != null && String(d.architect_ja).trim() !== ""
            ? String(d.architect_ja)
            : f.architect_ja,
        architect_en: f.architect_en.trim()
          ? f.architect_en
          : d.architect_en != null && String(d.architect_en).trim() !== ""
            ? String(d.architect_en)
            : f.architect_en,
        year: f.year.trim()
          ? f.year
          : d.year != null && Number.isFinite(d.year)
            ? String(d.year)
            : f.year,
        summary_ja: f.summary_ja.trim()
          ? f.summary_ja
          : d.summary_ja != null && String(d.summary_ja).trim() !== ""
            ? String(d.summary_ja)
            : f.summary_ja,
        summary_en: f.summary_en.trim()
          ? f.summary_en
          : d.summary_en != null && String(d.summary_en).trim() !== ""
            ? String(d.summary_en)
            : f.summary_en,
      }));
      setFormAiMeta((prev) => {
        const next = { ...prev };
        const dm = createAiDraftMeta();
        if (
          !before.name_en.trim() &&
          d.name_en != null &&
          String(d.name_en).trim() !== ""
        ) {
          next.nameEn = dm;
        }
        if (
          !before.architect_ja.trim() &&
          d.architect_ja != null &&
          String(d.architect_ja).trim() !== ""
        ) {
          next.architectName = dm;
        }
        if (
          !before.architect_en.trim() &&
          d.architect_en != null &&
          String(d.architect_en).trim() !== ""
        ) {
          next.architectName = dm;
        }
        if (!before.year.trim() && d.year != null && Number.isFinite(d.year)) {
          next.year = dm;
        }
        if (
          !before.summary_ja.trim() &&
          d.summary_ja != null &&
          String(d.summary_ja).trim() !== ""
        ) {
          next.summary = dm;
        }
        if (
          !before.summary_en.trim() &&
          d.summary_en != null &&
          String(d.summary_en).trim() !== ""
        ) {
          next.summary = dm;
        }
        return next;
      });
      if (data.disclaimer) setAiDraftNote(data.disclaimer);
    } catch {
      setError("AI 下書きの通信に失敗しました。");
    } finally {
      setAiDrafting(false);
    }
  }, [form]);

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
      if (!form.name_ja.trim() && !form.name_en.trim()) {
        setError("名称は日本語または英語のいずれかを入力してください。");
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

      const galleryExtras = form.gallery_urls
        .map((u) => u.trim())
        .filter(Boolean)
        .slice(0, MVP_GALLERY_MAX_EXTRA);

      const name = {
        ja: form.name_ja.trim(),
        en: form.name_en.trim(),
      };
      const address = {
        ja: form.address_ja.trim(),
        en: form.address_en.trim(),
      };
      const summaryJa = form.summary_ja.trim();
      const summaryEn = form.summary_en.trim();
      const archJa = form.architect_ja.trim();
      const archEn = form.architect_en.trim();

      const body: Record<string, unknown> = {
        name,
        address,
        lat,
        lng,
        place_id: form.place_id.trim() || undefined,
        year,
        cover_image: form.cover_image.trim() || undefined,
        gallery_urls: galleryExtras.length > 0 ? galleryExtras : undefined,
        aiMeta: pruneBuildingAiMeta(formAiMeta) ?? null,
      };

      if (summaryJa || summaryEn) {
        body.summary = { ja: summaryJa || undefined, en: summaryEn || undefined };
      }
      if (archJa || archEn) {
        body.architectName = { ja: archJa || undefined, en: archEn || undefined };
      }
      if (rawSourceDraft) {
        body.rawSource = rawSourceDraft;
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
          message?: string;
          id?: string;
        };
        if (!res.ok) {
          if (
            res.status === 503 &&
            data.error === "firebase_admin_not_configured"
          ) {
            setError(
              "サーバーに FIREBASE_SERVICE_ACCOUNT_JSON が未設定です。サービスアカウント JSON を .env.local（本番はホストの環境変数）に1行で設定してください。",
            );
          } else if (res.status === 400) {
            setError(
              typeof data.error === "string" && data.error.length > 0
                ? data.error
                : "入力内容を確認してください。",
            );
          } else if (res.status === 500 || res.status === 502) {
            setError(
              data.error === "create_failed" || data.error === "update_failed"
                ? "Firestore への保存に失敗しました。Firebase プロジェクトの有効性・課金・サービスアカウント権限を確認してください。"
                : (data.message ?? `保存に失敗しました（${res.status}）`),
            );
          } else {
            setError(
              data.message ??
                data.error ??
                `保存に失敗しました（${res.status}）`,
            );
          }
          return;
        }
        const id = mode === "create" ? data.id : buildingId;
        if (!id) {
          setError("レスポンスに id がありません。");
          return;
        }
        if (mode === "create") {
          clearBuildingRegistrationDraft();
        }
        router.push(`/buildings/${id}`);
        router.refresh();
      } catch {
        setError("通信に失敗しました。");
      } finally {
        setSubmitting(false);
      }
    },
    [form, formAiMeta, mode, buildingId, router, rawSourceDraft],
  );

  const handleDeleteBuilding = useCallback(async () => {
    if (mode !== "edit" || !buildingId) return;
    const strings = appUiStrings(uiLocale);
    if (!window.confirm(strings.editDeleteBuildingConfirm)) return;
    setDeletingBuilding(true);
    setError(null);
    try {
      const res = await fetch(`/api/buildings/${buildingId}`, {
        method: "DELETE",
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        if (res.status === 503 && data.error === "firebase_admin_not_configured") {
          setError(
            "サーバーに FIREBASE_SERVICE_ACCOUNT_JSON が未設定です。削除には Firebase 管理 API が必要です。",
          );
        } else {
          setError(strings.editDeleteBuildingFailed);
        }
        return;
      }
      clearBuildingOverride(buildingId);
      router.push("/");
      router.refresh();
    } catch {
      setError(appUiStrings(uiLocale).editDeleteBuildingFailed);
    } finally {
      setDeletingBuilding(false);
    }
  }, [mode, buildingId, router, uiLocale]);

  return (
    <form
      onSubmit={handleSubmit}
      className="archinotes-max-w-form space-y-5 pb-12"
    >
      {prefillStatus === "loading" && (
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          <p className="text-muted-foreground text-xs">
            Google Places から初期値を取得しています…
          </p>
          <Skeleton variant="rounded" height={36} animation="wave" />
          <Skeleton variant="rounded" height={36} animation="wave" />
          <Skeleton variant="rounded" height={36} animation="wave" />
        </Stack>
      )}
      {prefillStatus === "error" && placeIdFromUrl && (
        <p className="text-muted-foreground text-sm">
          初期値の取得に失敗しました。Place ID のみ反映しています。手入力で補ってください。
        </p>
      )}
      {error && (
        <p className="text-destructive bg-destructive/10 rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <div>
        <label className={labelClass} htmlFor="mvp-name-ja">
          名称（日本語） <span className="text-destructive">*</span>
        </label>
        <input
          id="mvp-name-ja"
          className={inputClass}
          value={form.name_ja}
          onChange={set("name_ja")}
          autoComplete="off"
        />
        <p className="text-muted-foreground mt-1 text-xs">
          日本語・英語のどちらか一方以上があれば保存できます。
        </p>
      </div>

      <div>
        <label className={labelClass} htmlFor="mvp-name-en">
          <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
            <span>名称（英語）</span>
            <FormAiHint show={Boolean(formAiMeta.nameEn?.isAiSuggested)} />
          </span>
        </label>
        <input
          id="mvp-name-en"
          className={inputClass}
          value={form.name_en}
          onChange={setTracked("name_en")}
          autoComplete="off"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="mvp-address-ja">
          住所（日本語・任意）
        </label>
        <input
          id="mvp-address-ja"
          className={inputClass}
          value={form.address_ja}
          onChange={set("address_ja")}
          placeholder="例: 東京都渋谷区..."
          autoComplete="street-address"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="mvp-address-en">
          住所（英語・任意）
        </label>
        <input
          id="mvp-address-en"
          className={inputClass}
          value={form.address_en}
          onChange={set("address_en")}
          placeholder="e.g. Shibuya, Tokyo..."
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

      <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-3">
        <p className="text-muted-foreground mb-2 text-xs leading-relaxed">
          空欄の項目に、名称・住所・座標・Place ID を手がかりに AI
          が下書き案を入れます（推測であり誤ることがあります）。必ず確認してから保存してください。
          AI が入れた項目は各ラベル横に小さく「AI」と表示され、保存時に DB にも記録されます。手で直すと表示は消えます。
        </p>
        <Button
          type="button"
          variant="secondary"
          disabled={aiDrafting || submitting}
          onClick={handleAiDraft}
        >
          {aiDrafting ? "AI 下書き取得中…" : "AIで下書きを入れる"}
        </Button>
        {aiDraftNote && (
          <p className="text-muted-foreground mt-2 text-xs">{aiDraftNote}</p>
        )}
      </div>

      <div>
        <label className={labelClass} htmlFor="mvp-architect-ja">
          <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
            <span>建築家（日本語・任意）</span>
            <FormAiHint show={Boolean(formAiMeta.architectName?.isAiSuggested)} />
          </span>
        </label>
        <input
          id="mvp-architect-ja"
          className={inputClass}
          value={form.architect_ja}
          onChange={setTracked("architect_ja")}
          autoComplete="off"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="mvp-architect-en">
          <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
            <span>建築家（英語・任意）</span>
            <FormAiHint show={Boolean(formAiMeta.architectName?.isAiSuggested)} />
          </span>
        </label>
        <input
          id="mvp-architect-en"
          className={inputClass}
          value={form.architect_en}
          onChange={setTracked("architect_en")}
          autoComplete="off"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="mvp-year">
          <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
            <span>完成年（任意）</span>
            <FormAiHint show={Boolean(formAiMeta.year?.isAiSuggested)} />
          </span>
        </label>
        <input
          id="mvp-year"
          className={inputClass}
          value={form.year}
          onChange={setTracked("year")}
          inputMode="numeric"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="mvp-summary-ja">
          <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
            <span>概要（日本語・任意）</span>
            <FormAiHint show={Boolean(formAiMeta.summary?.isAiSuggested)} />
          </span>
        </label>
        <textarea
          id="mvp-summary-ja"
          className={`${inputClass} min-h-[100px] py-2`}
          value={form.summary_ja}
          onChange={setTracked("summary_ja")}
          rows={4}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="mvp-summary-en">
          <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
            <span>概要（英語・任意）</span>
            <FormAiHint show={Boolean(formAiMeta.summary?.isAiSuggested)} />
          </span>
        </label>
        <textarea
          id="mvp-summary-en"
          className={`${inputClass} min-h-[100px] py-2`}
          value={form.summary_en}
          onChange={setTracked("summary_en")}
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
        <p className="text-muted-foreground mt-1 text-xs">
          カバー1枚＋追加最大 {MVP_GALLERY_MAX_EXTRA} 枚（合計15枚まで）。Wikipedia
          / Wikimedia 等の https URL を想定しています。
        </p>
        <div className="mt-3">
          <CommonsImagePicker
            disabled={submitting}
            canAddGallery={
              form.gallery_urls.length < MVP_GALLERY_MAX_EXTRA
            }
            onPickCover={(fullUrl) =>
              setForm((f) => ({ ...f, cover_image: fullUrl }))
            }
            onPickGallery={(fullUrl) =>
              setForm((f) => {
                if (f.gallery_urls.length >= MVP_GALLERY_MAX_EXTRA) return f;
                if (f.gallery_urls.includes(fullUrl)) return f;
                return { ...f, gallery_urls: [...f.gallery_urls, fullUrl] };
              })
            }
          />
        </div>
      </div>

      <div>
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <span className={labelClass}>追加画像 URL（任意）</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={
              form.gallery_urls.length >= MVP_GALLERY_MAX_EXTRA || submitting
            }
            onClick={addGalleryRow}
          >
            URL を追加
          </Button>
        </div>
        <ul className="space-y-2">
          {form.gallery_urls.map((url, i) => (
            <li key={i} className="flex gap-2">
              <input
                className={inputClass}
                type="url"
                value={url}
                onChange={(e) => setGalleryUrl(i, e.target.value)}
                placeholder="https://..."
                aria-label={`追加画像 ${i + 1}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() => removeGalleryRow(i)}
              >
                削除
              </Button>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground mt-1 text-xs">
          残り {MVP_GALLERY_MAX_EXTRA - form.gallery_urls.length} 枠
        </p>
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
        {mode === "create" && (
          <Button
            type="button"
            variant="ghost"
            disabled={submitting}
            onClick={handleClearDraft}
          >
            下書きを消す
          </Button>
        )}
      </div>

      {mode === "edit" && buildingId ? (
        <details className="text-muted-foreground border-border mt-10 border-t pt-6 text-xs">
          <summary className="cursor-pointer select-none hover:text-foreground">
            {ui.editAdvancedOptions}
          </summary>
          <div className="mt-3 space-y-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="shadow-none"
              disabled={submitting || deletingBuilding}
              onClick={handleDeleteBuilding}
            >
              {deletingBuilding ? ui.editDeleting : ui.editDeleteBuilding}
            </Button>
          </div>
        </details>
      ) : null}
    </form>
  );
}
