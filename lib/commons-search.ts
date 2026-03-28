/** Wikimedia Commons API（検索のみ・サーバーから呼ぶ） */

export type CommonsImageResult = {
  title: string;
  pageUrl: string;
  /** フルサイズ（登録に保存する URL） */
  fullUrl: string;
  thumbUrl: string | null;
  mime: string | null;
};

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

const USER_AGENT =
  "ArchiNotes/1.0 (https://github.com/gumifu/ArchiNotes; educational map app)";

function wikiTitleToPageUrl(title: string): string {
  return `https://commons.wikimedia.org/wiki/${encodeURIComponent(
    title.replace(/ /g, "_"),
  )}`;
}

type MwImageInfo = {
  url?: string;
  thumburl?: string;
  mime?: string;
};

type MwPage = {
  title?: string;
  imageinfo?: MwImageInfo[];
};

/**
 * Commons の File 名前空間を検索し、画像ファイルの URL 一覧を返す。
 */
export async function searchCommonsImages(
  query: string,
  limit: number,
): Promise<CommonsImageResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url = new URL(COMMONS_API);
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", q);
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("gsrlimit", String(Math.min(30, Math.max(1, limit))));
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|mime|size");
  url.searchParams.set("iiurlwidth", "320");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
    next: { revalidate: 120 },
  });

  if (!res.ok) {
    throw new Error(`Commons API HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    error?: { info?: string };
    query?: { pages?: Record<string, MwPage> };
  };

  if (data.error) {
    throw new Error(data.error.info ?? "Commons API error");
  }

  const pages = data.query?.pages;
  if (!pages || typeof pages !== "object") return [];

  const out: CommonsImageResult[] = [];
  for (const page of Object.values(pages)) {
    const title = page.title;
    const ii = page.imageinfo?.[0];
    if (!title || !ii?.url) continue;
    const mime = ii.mime ?? null;
    if (mime && !mime.startsWith("image/")) continue;

    out.push({
      title,
      pageUrl: wikiTitleToPageUrl(title),
      fullUrl: ii.url,
      thumbUrl: ii.thumburl ?? null,
      mime,
    });
  }

  return out;
}
