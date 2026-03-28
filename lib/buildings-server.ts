import { firestoreDataToBuilding } from "@/lib/building-mvp";
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
