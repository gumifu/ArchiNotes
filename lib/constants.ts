/**
 * 建築・建築家の画像がないときに表示するプレースホルダー画像
 * 対応ファイル: public/images/placeholder.png
 */
export const PLACEHOLDER_IMAGE_URL = "/images/placeholder.png";

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
