import buildingsData from "@/data/buildings.json";
import type { Building } from "@/types/building";
import {
  collection,
  getDocs,
  query,
  where,
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

function toDateString(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value) {
    const d = (value as { toDate: () => Date }).toDate();
    return d.toISOString();
  }
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function docToBuilding(doc: QueryDocumentSnapshot<DocumentData>): Building {
  const data = doc.data();
  return {
    id: doc.id,
    slug: data.slug ?? "",
    name: data.name ?? "",
    nameJa: data.nameJa,
    architectId: data.architectId ?? "",
    architectName: data.architectName ?? data.architect ?? "",
    yearCompleted: data.yearCompleted ?? data.year ?? null,
    status: data.status,
    country: data.country ?? "",
    city: data.city ?? "",
    ward: data.ward,
    district: data.district,
    address: data.address,
    location: data.location ?? { lat: 0, lng: 0 },
    geoPointSource: data.geoPointSource,
    coverImageUrl: data.coverImageUrl,
    gallery: data.gallery,
    buildingType: data.buildingType,
    style: data.style,
    structure: data.structure,
    materials: data.materials,
    floorsAboveGround: data.floorsAboveGround ?? null,
    floorsBelowGround: data.floorsBelowGround ?? null,
    siteAreaSqm: data.siteAreaSqm ?? null,
    floorAreaSqm: data.floorAreaSqm ?? null,
    description: data.description,
    shortDescription: data.shortDescription,
    historicalContext: data.historicalContext,
    designHighlights: data.designHighlights,
    experienceTags: data.experienceTags,
    styleTags: data.styleTags,
    visitTips: data.visitTips,
    nearestStation: data.nearestStation,
    officialWebsite: data.officialWebsite,
    googleMapsUrl: data.googleMapsUrl,
    published: data.published ?? false,
    featured: data.featured ?? false,
    createdAt: toDateString(data.createdAt),
    updatedAt: toDateString(data.updatedAt),
  };
}

export async function getPublishedBuildings(): Promise<Building[]> {
  const buildingsRef = collection(db, "buildings");
  const q = query(buildingsRef, where("published", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToBuilding);
}
