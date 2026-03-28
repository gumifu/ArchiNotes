"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getLocalBuildings, getPublishedBuildings } from "@/lib/buildings";
import { getImageUrl, MAP_DEFAULT_CENTER } from "@/lib/constants";
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

const DEFAULT_CENTER = MAP_DEFAULT_CENTER;
const DEFAULT_ZOOM = 12;

/**
 * デフォルト UI は位置がバラけるので disableDefaultUI から再構成。
 * 地図種類は上辺の右端（BLOCK_START_INLINE_END）で右寄せ。ズーム等は右下（INLINE_END_BLOCK_END）。
 * idle 後に再適用してレイアウトを確定させる。
 */
function MapControlsLayout() {
  const map = useMap();

  useEffect(() => {
    if (
      !map ||
      typeof google === "undefined" ||
      !google.maps?.ControlPosition
    ) {
      return;
    }

    const apply = () => {
      const mapTypeTopRight =
        google.maps.ControlPosition.BLOCK_START_INLINE_END;
      const bottomRight = google.maps.ControlPosition.INLINE_END_BLOCK_END;
      map.setOptions({
        disableDefaultUI: true,
        controlSize: 28,
        rotateControl: false,
        scaleControl: false,
        mapTypeControl: true,
        mapTypeControlOptions: {
          position: mapTypeTopRight,
          style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        },
        zoomControl: true,
        zoomControlOptions: { position: bottomRight },
        streetViewControl: true,
        streetViewControlOptions: { position: bottomRight },
        fullscreenControl: true,
        fullscreenControlOptions: { position: bottomRight },
      });
    };

    apply();
    const idleListener = google.maps.event.addListenerOnce(map, "idle", apply);
    return () => {
      google.maps.event.removeListener(idleListener);
    };
  }, [map]);

  return null;
}

type BuildingMarkerProps = {
  building: Building;
  onRef: (index: number, marker: AdvancedMarkerElement | null) => void;
  index: number;
  onSelect: (building: Building) => void;
};

function BuildingMarker({
  building,
  onRef,
  index,
  onSelect,
}: BuildingMarkerProps) {
  return (
    <AdvancedMarker
      ref={(m) => onRef(index, m)}
      position={building.location}
      onClick={() => onSelect(building)}
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
  onSelect,
}: {
  buildings: Building[];
  onSelect: (building: Building) => void;
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
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

export type ArchitectureMapProps = {
  /** When provided, marker tap opens bottom sheet instead of navigating. */
  onBuildingSelect?: (building: Building) => void;
  /** Use buildings from parent (e.g. MapContainer) instead of fetching. */
  buildingsProp?: Building[] | null;
  /** If true, map fills the viewport (for map-first layout). */
  fullscreen?: boolean;
};

export function ArchitectureMap({
  onBuildingSelect,
  buildingsProp = null,
  fullscreen = false,
}: ArchitectureMapProps = {}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const router = useRouter();
  const [buildingsState, setBuildingsState] = useState<Building[]>([]);
  const [loading, setLoading] = useState(!buildingsProp);
  const [error, setError] = useState<string | null>(null);

  const buildings = buildingsProp != null ? buildingsProp : buildingsState;

  const fetchBuildings = useCallback(async () => {
    if (buildingsProp != null) return;
    const useFirestore = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!useFirestore) {
      setBuildingsState(getLocalBuildings());
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const list = await getPublishedBuildings();
      setBuildingsState(list);
    } catch {
      setBuildingsState(getLocalBuildings());
      setError(
        "Firestore から取得できませんでした。ローカルデータを表示しています。",
      );
    } finally {
      setLoading(false);
    }
  }, [buildingsProp]);

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  const handleSelect = useCallback(
    (building: Building) => {
      if (onBuildingSelect) {
        onBuildingSelect(building);
      } else {
        router.push(`/buildings/${building.slug || building.id}`);
      }
    },
    [onBuildingSelect, router],
  );

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
      className={`architecture-map-root w-full ${fullscreen ? "h-screen min-h-0" : "min-h-[400px]"}`}
      style={
        fullscreen
          ? { height: "100vh", minHeight: 0 }
          : { height: "min(60vh, calc(100vh - 220px))" }
      }
    >
      <APIProvider apiKey={apiKey}>
        <Map
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? DEFAULT_MAP_ID}
          defaultCenter={DEFAULT_CENTER}
          defaultZoom={DEFAULT_ZOOM}
          gestureHandling="greedy"
          disableDefaultUI
          style={{ width: "100%", height: "100%" }}
        >
          <MapControlsLayout />
          {!loading && buildings.length > 0 && (
            <MapMarkers buildings={buildings} onSelect={handleSelect} />
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
