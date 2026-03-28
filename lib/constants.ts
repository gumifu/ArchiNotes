/**
 * 建築・建築家の画像がないときに表示するプレースホルダー画像
 * 対応ファイル: public/images/placeholder.png
 */
export const PLACEHOLDER_IMAGE_URL = "/images/placeholder.png";

/** 地図の初期中心（東京）— 検索バーの経路ボタンなどと共有 */
export const MAP_DEFAULT_CENTER = { lat: 35.6762, lng: 139.6503 };

/** Google マップで現在地からこの中心への経路を開く（起点はユーザーがマップ上で選ぶ） */
export function googleMapsDestinationCenterUrl(): string {
  const { lat, lng } = MAP_DEFAULT_CENTER;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/**
 * 画像URLが空の場合は public/images/placeholder.png を返す
 */
export function getImageUrl(url: string | undefined | null): string {
  const trimmed = url?.trim();
  if (trimmed && trimmed.length > 0) return trimmed;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${PLACEHOLDER_IMAGE_URL}`;
  }
  return PLACEHOLDER_IMAGE_URL;
}
