# ArchiNotes

建築を地図上で発見し、基本情報を確認できるアプリケーション。

## Tech Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS
- **Map**: Google Maps JavaScript API（@vis.gl/react-google-maps）
- **Hosting**: Vercel（想定）

## セットアップ

```bash
npm install
cp .env.example .env.local
# .env.local に以下を設定:
# - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY（Google Maps Platform）
# - Firebase 設定（NEXT_PUBLIC_FIREBASE_*）
npm run dev
```

- [Google Maps Platform](https://console.cloud.google.com/google/maps-apis/) で API キーを取得し、Maps JavaScript API を有効にしてください。
- [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成し、Firestore を有効化。アプリ設定から Web アプリの設定（apiKey, projectId など）を取得し、`.env.local` の `NEXT_PUBLIC_FIREBASE_*` に設定してください。

## MVP 仕様

[docs/mvp-spec.md](docs/mvp-spec.md) を参照。

## 開発フェーズ

- [x] Phase 1: Next.js セットアップ・Google Map 表示（Home `/`）
- [x] Phase 2: Firestore 接続・建築マーカー表示・クリックで詳細へ
- [x] Phase 3: 建築詳細ページ（Hero・基本情報・アクセス地図・ギャラリー）
- [ ] Phase 4: UI 調整
# ArchiNotes
