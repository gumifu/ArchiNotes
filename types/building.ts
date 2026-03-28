import type { BuildingAiMeta } from "@/types/building-ai-meta";

/** ユーザー向けテキスト（日本語・英語を同一フィールドに混在させない） */
export type LocalizedText = {
  ja?: string;
  en?: string;
};

/** 必須ロケールやペア不整合の検出用（Firestore に保存） */
export type BuildingLocaleValidation = {
  /** 値が欠けているフィールドキー（例: name, address） */
  missingJa?: string[];
  missingEn?: string[];
};

/** 外部ソースの生データ（表示の唯一の根拠にはしない） */
export type BuildingRawSource = {
  googlePlaces?: Record<string, unknown> | null;
};

export type Building = {
  id: string;
  slug: string;
  name: LocalizedText;
  architectId: string;
  architectName?: LocalizedText;
  yearCompleted?: number | null;
  status?: "built" | "unbuilt" | "renovated";
  country: string;
  city: string;
  ward?: string;
  district?: string;
  address?: LocalizedText;
  location: {
    lat: number;
    lng: number;
  };
  geoPointSource?: string;
  coverImageUrl?: string;
  gallery?: string[];
  buildingType?: string;
  style?: string;
  structure?: string;
  materials?: string[];
  floorsAboveGround?: number | null;
  floorsBelowGround?: number | null;
  siteAreaSqm?: number | null;
  floorAreaSqm?: number | null;
  /** 長文概要（旧 description / shortDescription は読み取り時にマージ） */
  summary?: LocalizedText;
  historicalContext?: string;
  designHighlights?: string[];
  experienceTags?: string[];
  styleTags?: string[];
  visitTips?: string[];
  nearestStation?: string;
  officialWebsite?: string;
  googleMapsUrl?: string;
  /**
   * Google Places の place_id（長期保存可。Google 側の推奨に沿い古い ID は更新検討）。
   * その他の Places 本文・写真メタの DB 永続化は docs/google-maps-platform-data-policy.md を参照。
   */
  googlePlaceId?: string;
  /**
   * Google Places 由来の表示を「確認した」日時（ISO）。UI の「情報確認日」に使用。
   * 自動更新（120/45 日）・手動トリガーで更新。鮮度ロジックは lib/place-info-freshness.ts。
   */
  placeInfoVerifiedAt?: string;
  /**
   * 直近の確認のきっかけ（任意）。scheduled | manual | user_report | admin | featured
   */
  placeInfoVerificationSource?: string;
  /** MVP 集計（Firestore 更新。未設定時は 0 扱い） */
  viewCount?: number;
  pinClickCount?: number;
  saveCount?: number;
  journalCount?: number;
  searchHitCount?: number;
  /** view*1 + pin*0.5 + save*3 + journal*5 + search_hit*1 */
  popularityScore?: number;
  /** 将来拡張用（構造・素材など）。Firestore の metadata と対応 */
  metadata?: Record<string, unknown>;
  /** AI 補完の出典・フラグ（Firestore `aiMeta`） */
  aiMeta?: BuildingAiMeta;
  /** Google Places 等の取得時レスポンス（表示用の正規データではない） */
  rawSource?: BuildingRawSource;
  localeValidation?: BuildingLocaleValidation;
  published: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
};
