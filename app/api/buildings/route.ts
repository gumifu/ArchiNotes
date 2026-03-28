import {
  buildFirestoreWritePayload,
  firestoreDataToBuilding,
  parseCreateBody,
} from "@/lib/building-mvp";
import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { DocumentData } from "firebase/firestore";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

/**
 * GET /api/buildings — 一覧（マップ・管理用）
 */
export async function GET() {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      { error: "firebase_admin_not_configured" },
      { status: 503 },
    );
  }
  try {
    const db = getAdminFirestore();
    const snap = await db.collection("buildings").get();
    const list = snap.docs.map((d) =>
      firestoreDataToBuilding(d.id, d.data() as DocumentData),
    );
    return NextResponse.json({ buildings: list });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "list_failed" }, { status: 500 });
  }
}

/**
 * POST /api/buildings — 新規作成
 */
export async function POST(request: Request) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      { error: "firebase_admin_not_configured" },
      { status: 503 },
    );
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = parseCreateBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const id = randomUUID();
  const payload = buildFirestoreWritePayload(parsed.value);

  try {
    const db = getAdminFirestore();
    await db
      .collection("buildings")
      .doc(id)
      .set({
        ...payload,
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      });
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}
