const LS_FAVORITES = "archinotes-favorites";
const LS_RECENT = "archinotes-recent-buildings";
const LS_SEARCH_QUERIES = "archinotes-search-queries";
const MAX_RECENT = 10;
const MAX_SEARCH_QUERIES = 8;

export function notifyMapUserDataChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("archinotes-user-data-changed"));
}

export function getFavoriteBuildingIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_FAVORITES);
    const ids: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids)
      ? ids.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteBuildingId(id: string): boolean {
  try {
    let ids = getFavoriteBuildingIds();
    if (ids.includes(id)) {
      ids = ids.filter((x) => x !== id);
    } else {
      ids = [...ids, id];
    }
    localStorage.setItem(LS_FAVORITES, JSON.stringify(ids));
    notifyMapUserDataChanged();
    return ids.includes(id);
  } catch {
    return false;
  }
}

export function isFavoriteBuildingId(id: string): boolean {
  return getFavoriteBuildingIds().includes(id);
}

export function getRecentBuildingIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_RECENT);
    const ids: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids)
      ? ids.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

export function getRecentSearchQueries(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_SEARCH_QUERIES);
    const qs: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(qs)
      ? qs.filter(
          (x): x is string => typeof x === "string" && x.trim().length > 0,
        )
      : [];
  } catch {
    return [];
  }
}

/** 検索バーで決定したときに呼ぶ（最近の検索ワード用） */
export function recordSearchQuery(query: string): void {
  const trimmed = query.trim();
  if (!trimmed) return;
  try {
    let qs = getRecentSearchQueries().filter((q) => q !== trimmed);
    qs = [trimmed, ...qs].slice(0, MAX_SEARCH_QUERIES);
    localStorage.setItem(LS_SEARCH_QUERIES, JSON.stringify(qs));
    notifyMapUserDataChanged();
  } catch {
    /* ignore */
  }
}

/** 一覧・詳細を開いたときに呼ぶ（最近の履歴用） */
export function recordBuildingOpened(id: string): void {
  try {
    let ids = getRecentBuildingIds().filter((x) => x !== id);
    ids = [id, ...ids].slice(0, MAX_RECENT);
    localStorage.setItem(LS_RECENT, JSON.stringify(ids));
    notifyMapUserDataChanged();
  } catch {
    /* ignore */
  }
}
