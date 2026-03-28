# Google Maps Platform — データ保存方針（Firestore / DB 接続時）

**目的:** DB や永続ストレージを本番運用する際、Google Maps Platform の利用条件に沿う。**一次情報は [Google Maps Platform Terms](https://cloud.google.com/maps-platform/terms) および各 API の Service Specific Terms / 製品ドキュメントを優先すること。**

---

## 1. 原則

- **Google Maps Content** は原則 **キャッシュしない・恒久保存しない**。許可された例外に限る。
- ArchiNotes の**建築マスタの本体**は **自前データ**（名称・建築家・説明・独自画像・キュレーション等）。**Google のレスポンスをマスタ DB の代替として長期保存しない**。

---

## 2. 保存してよいもの（方針）

| 項目 | 方針 |
|------|------|
| **Place ID** | **長期保存可**（後で Place Details 等の再取得に使う）。12 か月超は更新推奨の記載あり。`NOT_FOUND` になり得るので再解決が必要な場合あり。 |
| **自社独自データ** | 建築メモ、カテゴリ、コレクション、ユーザー投稿、独自タグ、独自写真、独自ランキング指標など。 |
| **lat / lng（Places / Geocoding 由来）** | **最大 30 日間の一時キャッシュ**（Service Specific Terms の整理）。**取得日時を必ず保存**し、30 日超えたら再取得・削除を検討する。 |

---

## 3. 長期保存しない（マスタ化しない）もの

| 項目 | 方針 |
|------|------|
| **Place Details / Text Search / Nearby Search の本文**（名称・住所・評価・営業時間・カテゴリ等を Google から取っただけのもの） | **永続のマスタとして保存しない**。表示時または短期ジョブで取得する設計に寄せる。 |
| **検索結果の内容** | 同上。 |
| **Place Photo の photo resource name**（新 API 等） | **長期キャッシュ・恒久保存は避ける**（ドキュメント上、名前の失効・キャッシュ禁止の扱いがある）。写真は **必要時に Place Details 等から再取得してから**表示する。 |
| **レビュー本文** | コピー保存は規約上の扱いが重い。必要なら公式の表示条件・帰属表示を必ず確認。 |

---

## 4. このリポジトリの現状（実装メモ）

- **`googlePlaceId`**（`Building` 型）を建築に紐づけ可能。**DB に載せてよい**のはこの ID と自前フィールドが中心。
- **`/api/places-photo`** / **`/api/places-details`** は **表示時の補助**としてサーバで取得。**メモリ上の短期キャッシュ**（例: 24h TTL）あり。**これを「恒久 DB スキャッシュの代替」にしない**こと。Firestore に Google レスポンス丸ごとを書き込む前提は取らない。
- **写真 URL**（`photo_reference` 等の生成 URL）は **DB に永続保存しない**方針で設計を進める。

---

## 5. DB 接続・スキーマ変更時のチェックリスト

- [ ] Firestore（または RDB）に **Google のレスポンス JSON 全文**を保存しない。
- [ ] **保存するのは `place_id` と自前データ**が主。Google 由来の表示用フィールドは **都度取得**か、**許可された範囲の一時キャッシュのみ**。
- [ ] **lat/lng** を Places / Geocoding から保存する場合は、`fetchedAt` 等を付与し **30 日ルール**を運用で担保する。
- [ ] **写真**は photo メタの恒久保存をしない。表示のたびに Place Details を再取得する流れを維持する。
- [ ] Places / Geocoding データを **Google マップ以外の UI だけ**で出す場合は、**Google の attribution**（ロゴ・テキスト等）要件を満たす。
- [ ] レビュー・写真・third-party attributions の **表示要件**を公式ドキュメントで確認する。

---

## 6. 鮮度（MVP）

**保存するのは日付メタのみ**（`placeInfoVerifiedAt`）。Places のレスポンス本文は引き続き都度取得しない。

### 自動更新（目安）

| 区分 | 間隔 |
|------|------|
| 通常建築 | **120 日ごと** |
| 人気建築（`featured` または `popularityScore` ≥ 閾値） | **45 日ごと** |

判定・経過日は `lib/place-info-freshness.ts` の `isPlaceInfoStale` / `getPlaceInfoRefreshIntervalDays`。

### 手動更新トリガー（運用）

- ユーザーが「情報が違う」と報告したとき
- 管理者が気づいたとき
- 特集掲載する建築

上記のあと、Firestore の `placeInfoVerifiedAt` を更新する。サーバからは `POST /api/buildings/[id]/place-info-verified`（`x-place-info-verify-secret` と `PLACE_INFO_VERIFY_SECRET`）で現在時刻に更新可能。

### UI 文言（固定）

- 「情報確認日：YYYY-MM-DD」（`placeInfoVerifiedAt` から）
- 「一部情報は Google Places を参照しています」
- 「現地訪問前に公式情報もご確認ください」

実装: `components/building-google-place-info.tsx`。
