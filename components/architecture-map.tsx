"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getLocalBuildings, getPublishedBuildings } from "@/lib/buildings";
import { getImageUrl } from "@/lib/constants";
import type { Building } from "@/types/building";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import {
  AdvancedMarker,
  APIProvider,
  Map,
  useMap,
  type AdvancedMarkerRef,
} from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type AdvancedMarkerElement = NonNullable<AdvancedMarkerRef>;

const MARKER_SIZE = 48;

/** Advanced Marker 用の Map ID（未設定時は Google のデモ ID を使用） */
const DEFAULT_MAP_ID = "DEMO_MAP_ID";

const DEFAULT_CENTER = { lat: 35.6762, lng: 139.6503 }; // 東京
const DEFAULT_ZOOM = 12;

type BuildingMarkerProps = {
  building: Building;
  onRef: (index: number, marker: AdvancedMarkerElement | null) => void;
  index: number;
  onNavigate: (id: string) => void;
};

function BuildingMarker({
  building,
  onRef,
  index,
  onNavigate,
}: BuildingMarkerProps) {
  return (
    <AdvancedMarker
      ref={(m) => onRef(index, m)}
      position={building.location}
      onClick={() => onNavigate(building.id)}
      title={building.name}
    >
      <div
        className="overflow-hidden rounded-full border-2 border-white shadow-md transition-transform hover:scale-110"
        style={{
          width: MARKER_SIZE,
          height: MARKER_SIZE,
          cursor: "pointer",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getImageUrl(building.coverImageUrl)}
          alt=""
          width={MARKER_SIZE}
          height={MARKER_SIZE}
          className="block h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.src = getImageUrl(null);
          }}
        />
      </div>
    </AdvancedMarker>
  );
}

function MapMarkers({
  buildings,
  onNavigate,
}: {
  buildings: Building[];
  onNavigate: (id: string) => void;
}) {
  const map = useMap();
  const markerRefs = useRef<(AdvancedMarkerElement | null)[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const [markersReady, setMarkersReady] = useState(false);

  const setMarkerRef = useCallback(
    (index: number, marker: AdvancedMarkerElement | null) => {
      markerRefs.current[index] = marker;
      if (marker && index === buildings.length - 1) {
        const arr = markerRefs.current
          .slice(0, buildings.length)
          .filter(Boolean);
        if (arr.length === buildings.length) {
          setMarkersReady(true);
        }
      }
    },
    [buildings.length],
  );

  useEffect(() => {
    setMarkersReady(false);
    markerRefs.current = new Array(buildings.length);
  }, [buildings]);

  useEffect(() => {
    if (!map || !markersReady || buildings.length === 0) return;
    const markers = markerRefs.current
      .slice(0, buildings.length)
      .filter((m): m is AdvancedMarkerElement => m != null);
    if (markers.length === 0) return;
    const clusterer = new MarkerClusterer({ map, markers });
    clustererRef.current = clusterer;
    return () => {
      clusterer.clearMarkers();
      clustererRef.current = null;
    };
  }, [map, markersReady, buildings.length]);

  if (buildings.length === 0) return null;
  return (
    <>
      {buildings.map((b, i) => (
        <BuildingMarker
          key={b.id}
          building={b}
          index={i}
          onRef={setMarkerRef}
          onNavigate={onNavigate}
        />
      ))}
    </>
  );
}

export function ArchitectureMap() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBuildings = useCallback(async () => {
    const useFirestore = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!useFirestore) {
      setBuildings(getLocalBuildings());
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const list = await getPublishedBuildings();
      setBuildings(list);
    } catch {
      setBuildings(getLocalBuildings());
      setError(
        "Firestore から取得できませんでした。ローカルデータを表示しています。",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  if (!apiKey) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-4">
        <Alert variant="default" className="max-w-md">
          <MapPin className="size-4" />
          <AlertTitle>Google Maps API キーが未設定です</AlertTitle>
          <AlertDescription>
            <p className="mt-1">
              .env.local に{" "}
              <code className="bg-muted rounded px-1 py-0.5 text-xs">
                NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
              </code>{" "}
              を設定してください。
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              See .env.example for reference.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div
      className="min-h-[400px] w-full"
      style={{ height: "min(60vh, calc(100vh - 220px))" }}
    >
      <APIProvider apiKey={apiKey}>
        <Map
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? DEFAULT_MAP_ID}
          defaultCenter={DEFAULT_CENTER}
          defaultZoom={DEFAULT_ZOOM}
          gestureHandling="greedy"
          disableDefaultUI={false}
          style={{ width: "100%", height: "100%" }}
        >
          {!loading && (
            <MapMarkers
              buildings={buildings}
              onNavigate={(id) => router.push(`/buildings/${id}`)}
            />
          )}
        </Map>
      </APIProvider>
      {error && (
        <p className="bg-destructive/10 text-destructive mt-2 px-2 py-1 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
