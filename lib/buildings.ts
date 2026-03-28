import buildingsData from "@/data/buildings.json";
import { firestoreDataToBuilding } from "@/lib/building-mvp";
import type { Building } from "@/types/building";
import {
  collection,
  getDocs,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

const localBuildings = buildingsData as Building[];

/**
 * data/buildings.json の建築のうち published なものを返す（DB未接続時用）
 */
export function getLocalBuildings(): Building[] {
  return localBuildings.filter((b) => b.published);
}

/**
 * ID で建築を1件取得（ローカル JSON から。未設定時は Firestore 対応可）
 */
export function getBuildingById(id: string): Building | null {
  const found = localBuildings.find((b) => b.id === id);
  return found ?? null;
}

/**
 * slug で建築を1件取得（URL 用）
 */
export function getBuildingBySlug(slug: string): Building | null {
  const found = localBuildings.find((b) => b.slug === slug || b.id === slug);
  return found ?? null;
}

function docToBuilding(doc: QueryDocumentSnapshot<DocumentData>): Building {
  return firestoreDataToBuilding(doc.id, doc.data());
}

/**
 * マップ用: Firestore `buildings` コレクションを全件取得（MVP）。
 */
export async function getBuildingsForMap(): Promise<Building[]> {
  const buildingsRef = collection(db, "buildings");
  const snapshot = await getDocs(buildingsRef);
  return snapshot.docs.map(docToBuilding);
}
