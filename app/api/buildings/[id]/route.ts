import {
  buildFirestoreWritePayload,
  firestoreDataToBuilding,
  parseCreateBody,
} from "@/lib/building-mvp";
import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { DocumentData } from "firebase/firestore";
import { NextResponse } from "next/server";

/**
 * GET /api/buildings/[id] — 1 件
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      { error: "firebase_admin_not_configured" },
      { status: 503 },
    );
  }
  try {
    const db = getAdminFirestore();
    const snap = await db.collection("buildings").doc(id).get();
    if (!snap.exists) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const building = firestoreDataToBuilding(snap.id, snap.data() as DocumentData);
    return NextResponse.json({ building });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "get_failed" }, { status: 500 });
  }
}

/**
 * PUT /api/buildings/[id] — 更新（MVP フォームと同一ボディ）
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }
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

  const payload = buildFirestoreWritePayload(parsed.value);

  try {
    const db = getAdminFirestore();
    const ref = db.collection("buildings").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    await ref.update({
      ...payload,
      updated_at: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}
