# ArchiNotes MVP 仕様書

## 1. Product Overview

ArchiNotes は、建築を地図上で発見し、基本情報を確認できるアプリケーションである。

ユーザーはマップ上の建築ピンを探索し、建築の基本情報（建築家・完成年・概要など）を閲覧できる。

このプロダクトの目的は、**建築探索の体験をシンプルに提供すること**である。

---

## 2. MVP Scope

MVPでは以下の機能のみ実装する。

### Core Experience

- 建築マップ表示
- 建築ピン表示
- 建築詳細ページ閲覧

**SNS機能、投稿機能などは MVPでは対象外** とする。

---

## 3. Target User

### Primary

- 建築学生
- 建築好きな人
- 建築を調べる人

### Secondary

- デザインやインテリアに興味がある人
- 建築旅行をする人

---

## 4. Tech Stack

| 領域 | 技術 |
|------|------|
| **Frontend** | Next.js (App Router), Tailwind CSS |
| **UI Kit** | [shadcn/ui](https://ui.shadcn.com/) |
| **アイコン** | [lucide-react](https://lucide.dev/) |
| **Map** | Google Maps JavaScript API |
| **Backend** | Firebase |
| **Database** | Firestore |
| **Hosting** | Vercel |

---

## 5. Information Architecture

MVPでは以下のページのみ存在する。

| Page | Path | Description |
|------|------|-------------|
| Home | `/` | 建築マップ表示 |
| Building Detail | `/buildings/[id]` | 建築詳細情報 |

---

## 6. User Flow

### Architecture Discovery Flow

```
User opens app
    ↓
Map loads
    ↓
Architecture pins are displayed
    ↓
User taps a building
    ↓
Building detail page opens
```

---

## 7. Page Specification

### 7.1 Home (Map Page)

**Purpose**

建築をマップ上で探索する。

**Components**

| Component | Description |
|-----------|-------------|
| Google Map | メインマップ |
| Building Marker | 建築ピン |
| Bottom Card (optional) | 簡易情報 |

**Behavior**

- Map表示
- Firestoreから建築取得
- Marker表示
- Markerクリックで詳細ページへ遷移

---

### 7.2 Building Detail Page

**Purpose**

建築の基本情報を確認する。

**Components**

| Component | Description |
|-----------|-------------|
| Hero Image | 建築写真 |
| Building Name | 建築名 |
| Architect | 建築家 |
| Year | 完成年 |
| Location | 場所 |
| Description | 簡易説明 |

---

## 8. Database Design

### Collection: `buildings`

#### Document Structure

`buildings/{buildingId}`

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| name | string | 建築名 |
| slug | string | URL用 |
| architect | string | 建築家 |
| year | number | 完成年 |
| country | string | 国 |
| city | string | 都市 |
| location | object | 緯度経度 |
| coverImageUrl | string | メイン画像 |
| description | string | 建築説明 |
| published | boolean | 公開状態 |
| createdAt | timestamp | 作成日時 |

#### Location Object

```ts
location: {
  lat: number
  lng: number
}
```

---

## 9. API / Data Fetching

### Firestore Query

**GET buildings**

- **条件**: `published == true`
- **取得後**: Map Marker表示

---

## 10. Non-Functional Requirements

| 項目 | 要件 |
|------|------|
| **Performance** | Map表示は3秒以内 |
| **SEO** | MVPでは最低限のみ（title, meta description） |

---

## 11. MVP Data

初期データは **3〜5件** とする。

例:

- Church of the Light
- 21_21 DESIGN SIGHT
- Vitra Fire Station

---

## 12. Future Features (Not MVP)

以下は将来機能。

| カテゴリ | 機能例 |
|----------|--------|
| **Social** | Follow, Feed, Comments |
| **Content** | Add Building, Review System |
| **Personal** | Save Building, Journal |
| **Discovery** | Architect filter, Era filter, Style filter |

---

## 13. Development Milestones

| Phase | 内容 |
|-------|------|
| Phase 1 | Next.js setup, Google Map表示 |
| Phase 2 | Firestore接続, Building markers表示 |
| Phase 3 | Building Detail page |
| Phase 4 | UI polish |

---

## 14. Success Criteria

### MVP成功条件

以下が動作すること。

```
Map loads
    ↓
Markers appear
    ↓
Click building
    ↓
Building page opens
```

---

## 重要なポイント

**この仕様書はあえて薄いです。**

理由は、**MVPは仕様書を厚くすると作れなくなるから**です。
