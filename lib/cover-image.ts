import { getImageUrl } from "@/lib/constants";
import { buildPlacesPhotoQueryString } from "@/lib/places-client-query";
import { DEFAULT_MAX_PLACE_PHOTOS } from "@/lib/places-photo";
import type { Building } from "@/types/building";

/**
 * マウント時に Places 写真を先に取りにいくか。
 * カバー無し、または `public` 配下の相対パス（未配置で 404 になりやすい）のとき true。
 * `https://` など外部 URL のときは false（まずその URL を表示し、失敗時は onError で Places）。
 */
export function shouldPrefetchPlacesPhoto(building: Building): boolean {
  const trimmed = building.coverImageUrl?.trim();
  if (!trimmed) return true;
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("http://") || lower.startsWith("https://")) {
    return false;
  }
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  return false;
}

/**
 * カバー画像 URL。Firestore 等に画像があればそれを使い、なければプレースホルダー。
 */
export function getBuildingCoverImageUrl(building: Building): string {
  const trimmed = building.coverImageUrl?.trim();
  if (trimmed) return trimmed;
  return getImageUrl(null);
}

export type ResolveCoverErrorOptions = {
  /** true のとき Places を試さない（useEffect で既に取得を試した場合の onError 用） */
  skipPlaces?: boolean;
};

/**
 * カバー画像の読み込み失敗時: Places 写真 → プレースホルダー。
 * apply で React state 更新または img.src 代入。
 */
export async function resolveBuildingCoverImageErrorAsync(
  building: Building,
  apply: (url: string) => void,
  _currentSrc: string,
  options?: ResolveCoverErrorOptions,
): Promise<void> {
  const skipPlaces = options?.skipPlaces ?? false;

  if (!skipPlaces) {
    try {
      const r = await fetch(
        `/api/places-photo?${buildPlacesPhotoQueryString(building, DEFAULT_MAX_PLACE_PHOTOS)}`,
      );
      if (r.ok) {
        const d = (await r.json()) as {
          url: string | null;
          urls?: string[];
        };
        const first = d.url ?? d.urls?.[0];
        if (first) {
          apply(first);
          return;
        }
      }
    } catch {
      /* fall through */
    }
  }

  apply(getImageUrl(null));
}

/**
 * カバー img の onError 用（レガシー）。内部は非同期。
 */
export function resolveBuildingCoverImageError(
  building: Building,
  img: HTMLImageElement,
): void {
  void resolveBuildingCoverImageErrorAsync(
    building,
    (url) => {
      img.src = url;
    },
    img.src,
    { skipPlaces: shouldPrefetchPlacesPhoto(building) },
  );
}
