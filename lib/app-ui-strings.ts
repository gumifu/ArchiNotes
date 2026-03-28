import type { LocaleCode } from "@/lib/locale-text";

/**
 * アプリ UI の固定文言（設定の UI 言語に合わせる）。
 * 建築データ本体は pickLocalized で別管理。
 */
export function appUiStrings(locale: LocaleCode) {
  const en = locale === "en";
  return {
    searchPlaceholder: en ? "Search ArchiNotes" : "ArchiNotes を検索",
    savedOnly: en ? "Saved only" : "保存済みのみ",
    close: en ? "Close" : "閉じる",
    carouselSeeDetails: en ? "See details" : "詳細を見る",
    mapPlaceSuggestionTitle: en ? "Suggested place" : "地図上の登録候補",
    mapPlaceHint: en
      ? "Check the orange pin on the map, then continue to register if it looks correct."
      : "地図のオレンジのピンで位置を確認し、問題なければ登録へ進んでください。",
    registerThisPlace: en ? "Register this place" : "この場所を登録する",
    dismissCandidate: en ? "Dismiss" : "候補を消す",
    archiNotesBuildings: (n: number) =>
      en
        ? `ArchiNotes buildings (${n})`
        : `ArchiNotes の建築（${n}件）`,
    noMatchingBuildings: en
      ? "No buildings match your search"
      : "該当する建築がありません",
    googleSuggestions: en ? "Google suggestions" : "Google の候補",
    googleMinChars: (min: number) =>
      en
        ? `Type at least ${min} characters for Google suggestions.`
        : `${min}文字以上で Google の候補を取得します。`,
    googleSuggestionsError: en
      ? "Could not load Google suggestions."
      : "Google の候補を取得できませんでした。",
    noMatchingPlaces: en
      ? "No matching places"
      : "該当する場所がありません",
    recentSearches: en ? "Recent searches" : "最近の検索",
    savedBuildings: en ? "Saved buildings" : "保存した建築",
    noSavedBuildings: en
      ? "No saved buildings yet. Save from a building’s details."
      : "保存した建築はありません。詳細から保存できます。",
    recentlyOpened: en ? "Recently opened" : "最近開いた建築",
    noRecentHistory: en ? "No history yet." : "まだ履歴がありません。",
    historyShowLess: en ? "Show less" : "履歴を閉じる",
    historyShowMore: en ? "Show more history" : "最近の履歴をもっと見る",
    searchAndSuggestions: en ? "Search & suggestions" : "検索・候補",
    searchPanelFooter: en
      ? "Type above to filter. When empty, suggestions come from registered buildings."
      : "上の欄に入力すると絞り込み、未入力時は登録建築からの候補です。",
    explorerSearchPlaceholder: en ? "Search buildings" : "建築を検索",
    explorerNoResults: en
      ? "No matching buildings"
      : "該当する建築がありません",
    directions: en ? "Directions" : "経路",
    save: en ? "Save" : "保存",
    nearby: en ? "Nearby" : "周辺",
    share: en ? "Share" : "共有",
    details: en ? "Details" : "詳細",
    backToListAria: en ? "Back to list" : "一覧に戻る",
    closeAria: en ? "Close" : "閉じる",
    yearCompleted: (y: number) =>
      en ? `Completed ${y}` : `${y}年完成`,
    nearestStation: (station: string) =>
      en ? `Nearest station: ${station}` : `最寄り: ${station}`,
    summaryHeading: en ? "Overview" : "概要",
    showLess: en ? "Show less" : "閉じる",
    showMore: en ? "Show more" : "もっと見る",
    photosHeading: en ? "Photos" : "写真",
    viewFullBuilding: en
      ? "View full building page"
      : "建築の全情報を見る",

    /** 建築詳細ページ（/buildings/[slug]） */
    detailBackToMap: en ? "Back to map" : "マップに戻る",
    detailEdit: en ? "Edit" : "編集",
    detailLocaleValidationHint: en
      ? "Some fields are missing text in one language. You can complete them when editing."
      : "日本語・英語のどちらか一方に未入力の項目があります。編集で補完できます。",
    detailFieldArchitect: en ? "Architect" : "建築家",
    detailFieldYear: en ? "Year completed" : "完成年",
    detailInfoTitle: en ? "Details" : "詳細情報",
    detailBasicInfo: en ? "Basics" : "基本情報",
    detailSectionAbout: en ? "About" : "建築について",
    detailLabelDescription: en ? "Description" : "説明",
    detailLabelLocation: en ? "Location" : "所在地",
    detailLabelUse: en ? "Use" : "用途",
    detailLabelStyle: en ? "Style" : "様式",
    detailHighlights: en ? "Highlights" : "見どころ",
    detailNoDescription: en
      ? "No description yet."
      : "説明はありません",
    detailAccess: en ? "Access" : "アクセス",
    detailNearestStation: (station: string) =>
      en ? `Nearest station: ${station}` : `最寄り: ${station}`,
    detailGooglePlaces: en ? "Google Places" : "Google Places",
    detailEditPageLink: en ? "Edit page" : "編集画面",
    detailGooglePlaceIdHintEnBefore: en
      ? "Enter a Google Place ID from the "
      : "",
    detailGooglePlaceIdHintEnAfter: en
      ? " to show opening hours and categories."
      : "",
    detailGooglePlaceIdHintJaSuffix: en
      ? ""
      : "から Google の place ID を入力すると、営業時間やカテゴリを表示できます。",

    /** Google Places 情報ブロック */
    googlePlaceLoading: en ? "Loading Google info…" : "Google 情報を読み込み中…",
    googlePlaceErrorPrefix: en
      ? "Could not load Google info: "
      : "Google 情報の取得に失敗しました: ",
    googlePlaceUnavailable: en
      ? "Google info is unavailable."
      : "Google 情報を表示できません。",
    googlePlaceBusinessStatus: en ? "Status" : "営業状態",
    googlePlaceOpenNow: en ? " · Now: " : " · 現在: ",
    googlePlaceLikelyOpen: en
      ? "Likely open"
      : "開いている可能性が高い",
    googlePlaceLikelyClosed: en
      ? "Likely closed"
      : "閉じている可能性が高い",
    googlePlaceCategory: en ? "Category" : "カテゴリ",
    googlePlaceHours: en ? "Opening hours" : "営業時間",
    googlePlaceContaining: en ? "Located within" : "所在施設",
    googlePlaceEditBuilding: en ? "Edit building info" : "建築情報を編集",
    googlePlaceOpenInMaps: en ? "Open in Google Maps" : "Google マップで開く",
    googlePlaceAttribution1: en
      ? "Some information comes from Google Places."
      : "一部情報は Google Places を参照しています。",
    googlePlaceAttribution2: en
      ? "Please verify with official sources before visiting."
      : "現地訪問前に公式情報もご確認ください。",
    genericFetchError: en ? "Failed to load." : "取得に失敗しました",

    /** マップ：モバイルメニュー */
    mapOpenListAria: en ? "Open building list" : "建築一覧を開く",

    /** 編集ページ（Firestore）：控えめな削除 */
    editAdvancedOptions: en ? "Advanced options" : "詳細オプション",
    editDeleteBuilding: en ? "Delete this building" : "この建築を削除",
    editDeleteBuildingConfirm: en
      ? "Delete this building permanently? This cannot be undone."
      : "この建築を削除しますか？元に戻せません。",
    editDeleteBuildingFailed: en
      ? "Could not delete this building."
      : "建築の削除に失敗しました。",
    editDeleting: en ? "Deleting…" : "削除中…",
  };
}

/** Google Places API の businessStatus コードを UI 文言に */
export function businessStatusLabel(
  locale: LocaleCode,
  code: string | undefined,
): string {
  const en = locale === "en";
  switch (code) {
    case "OPERATIONAL":
      return en ? "Operational" : "営業中";
    case "CLOSED_TEMPORARILY":
      return en ? "Temporarily closed" : "一時休業";
    case "CLOSED_PERMANENTLY":
      return en ? "Permanently closed" : "閉業";
    default:
      return code ?? "—";
  }
}
