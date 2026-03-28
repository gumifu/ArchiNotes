import { db } from "@/lib/firebase";
import type { BuildingStatEvent } from "@/lib/building-stats";
import { doc, runTransaction } from "firebase/firestore";
import { NextResponse } from "next/server";

const ALLOWED: BuildingStatEvent[] = [
  "view",
  "pin_click",
  "save",
  "journal",
  "search_hit",
];

function isEvent(x: unknown): x is BuildingStatEvent {
  return typeof x === "string" && ALLOWED.includes(x as BuildingStatEvent);
}

/**
 * POST /api/buildings/[id]/stats  body: { event: BuildingStatEvent }
 * Firestore `buildings/{id}` の集計と popularityScore を更新。
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    return new NextResponse(null, { status: 204 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const event = (body as { event?: unknown })?.event;
  if (!isEvent(event)) {
    return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  }

  try {
    await runTransaction(db, async (transaction) => {
      const ref = doc(db, "buildings", id);
      const snap = await transaction.get(ref);
      if (!snap.exists()) {
        throw new Error("not_found");
      }
      const d = snap.data();
      let viewCount = Number(d.viewCount ?? 0);
      let pinClickCount = Number(d.pinClickCount ?? 0);
      let saveCount = Number(d.saveCount ?? 0);
      let journalCount = Number(d.journalCount ?? 0);
      let searchHitCount = Number(d.searchHitCount ?? 0);

      switch (event) {
        case "view":
          viewCount += 1;
          break;
        case "pin_click":
          pinClickCount += 1;
          break;
        case "save":
          saveCount += 1;
          break;
        case "journal":
          journalCount += 1;
          break;
        case "search_hit":
          searchHitCount += 1;
          break;
        default:
          break;
      }

      const popularityScore =
        viewCount * 1 +
        pinClickCount * 0.5 +
        saveCount * 3 +
        journalCount * 5 +
        searchHitCount * 1;

      transaction.update(ref, {
        viewCount,
        pinClickCount,
        saveCount,
        journalCount,
        searchHitCount,
        popularityScore,
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "not_found") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "transaction_failed" }, { status: 500 });
  }
}
