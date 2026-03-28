import { firestoreDataToBuilding } from "@/lib/building-mvp";
import { isUuidLike } from "@/lib/building-slug";
import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import type { Building } from "@/types/building";
import type { DocumentData } from "firebase/firestore";

/**
 * サーバー専用: Firestore から 1 件（Admin SDK）。
 * 未設定時は null。
 */
export async function getBuildingFromFirestoreById(
  id: string,
): Promise<Building | null> {
  if (!isFirebaseAdminConfigured()) return null;
  const db = getAdminFirestore();
  const snap = await db.collection("buildings").doc(id).get();
  if (!snap.exists) return null;
  return firestoreDataToBuilding(snap.id, snap.data() as DocumentData);
}

/**
 * URL セグメント（slug または旧来の UUID）で 1 件取得。
 * - UUID 形: ドキュメント ID を先に参照（slug 未設定の旧データに対応）
 * - それ以外: `slug` フィールド一致
 */
export async function getBuildingFromFirestoreBySlugOrId(
  param: string,
): Promise<Building | null> {
  if (!isFirebaseAdminConfigured()) return null;
  const trimmed = param.trim();
  if (!trimmed) return null;

  const db = getAdminFirestore();

  if (isUuidLike(trimmed)) {
    const snap = await db.collection("buildings").doc(trimmed).get();
    if (snap.exists) {
      return firestoreDataToBuilding(snap.id, snap.data() as DocumentData);
    }
  }

  const bySlug = await db
    .collection("buildings")
    .where("slug", "==", trimmed)
    .limit(1)
    .get();
  if (!bySlug.empty) {
    const doc = bySlug.docs[0];
    return firestoreDataToBuilding(doc.id, doc.data() as DocumentData);
  }

  return null;
}

/**
 * POST 時: `slug` フィールドの重複を避けて確定値を返す。
 */
export async function reserveUniqueBuildingSlug(
  base: string,
  newDocId: string,
): Promise<string> {
  const db = getAdminFirestore();
  const safeBase = (base || "building").trim().slice(0, 120) || "building";
  let candidate = safeBase;
  for (let attempt = 0; attempt < 100; attempt++) {
    const q = await db
      .collection("buildings")
      .where("slug", "==", candidate)
      .limit(1)
      .get();
    if (q.empty) return candidate;
    if (attempt === 0) {
      candidate = `${safeBase}-${newDocId.slice(0, 8)}`;
    } else {
      candidate = `${safeBase}-${newDocId.slice(0, 8)}-${attempt + 1}`;
    }
  }
  throw new Error("slug_uniqueness_failed");
}
