import { db } from "@/lib/firebase";
import type { PlaceInfoVerificationSource } from "@/lib/place-info-freshness";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

const ALLOWED: PlaceInfoVerificationSource[] = [
  "scheduled",
  "manual",
  "user_report",
  "admin",
  "featured",
];

function isSource(x: unknown): x is PlaceInfoVerificationSource {
  return typeof x === "string" && ALLOWED.includes(x as PlaceInfoVerificationSource);
}

/**
 * POST /api/buildings/[id]/place-info-verified
 * Header: x-place-info-verify-secret: PLACE_INFO_VERIFY_SECRET
 * Body (optional): { source?: PlaceInfoVerificationSource }
 *
 * Firestore `buildings/{id}` の `placeInfoVerifiedAt` を現在時刻に更新（鮮度の公式な「確認日」）。
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const secret = process.env.PLACE_INFO_VERIFY_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "verify_secret_not_configured" },
      { status: 503 },
    );
  }

  const headerSecret = request.headers.get("x-place-info-verify-secret")?.trim();
  if (headerSecret !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    return NextResponse.json(
      { error: "firebase_not_configured" },
      { status: 503 },
    );
  }

  let body: { source?: unknown } = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text) as { source?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const source = body.source;
  if (source !== undefined && !isSource(source)) {
    return NextResponse.json({ error: "invalid_source" }, { status: 400 });
  }

  const ref = doc(db, "buildings", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const nowIso = new Date().toISOString();
  const patch: Record<string, unknown> = {
    placeInfoVerifiedAt: nowIso,
    updatedAt: serverTimestamp(),
  };
  if (source !== undefined) {
    patch.placeInfoVerificationSource = source;
  }

  await updateDoc(ref, patch);

  return NextResponse.json({
    ok: true,
    id,
    placeInfoVerifiedAt: nowIso,
    ...(source !== undefined ? { placeInfoVerificationSource: source } : {}),
  });
}
