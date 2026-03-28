"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useBuildingCoverImageSrc } from "@/hooks/use-building-cover-image";
import { useUiLocale } from "@/hooks/use-ui-locale";
import { pickLocalized } from "@/lib/locale-text";
import { getBuildingsForMap, getLocalBuildings } from "@/lib/buildings";
import { trackBuildingStat } from "@/lib/building-stats";
import { MAP_DEFAULT_CENTER } from "@/lib/constants";
import type { Building } from "@/types/building";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { useTheme } from "@mui/material/styles";
import {
  AdvancedMarker,
  APIProvider,
  Map,
  useMap,
  type AdvancedMarkerRef,
} from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/** 地図種類ボタンをマップ領域の右上（余白 16px）に固定 */
const MAP_TYPE_CONTROL_INSET = 16;

type AdvancedMarkerElement = NonNullable<AdvancedMarkerRef>;

const MARKER_SIZE = 48;

/** Advanced Marker 用の Map ID（未設定時は Google のデモ ID を使用） */
const DEFAULT_MAP_ID = "DEMO_MAP_ID";

const DEFAULT_CENTER = MAP_DEFAULT_CENTER;
const DEFAULT_ZOOM = 12;

/**
 * デフォルト UI は位置がバラけるので disableDefaultUI から再構成。
 * 地図種類は MapTypeControlPositionFix で右上 16px に固定。ズーム等は右下（INLINE_END_BLOCK_END）。
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

/**
 * 地図種類（Map）をマップ div 内で右上に固定し、ドロップダウンはボタン右端揃え。
 * Google が idle / DOM 更新で位置を戻すため MutationObserver で再適用する。
 */
function MapTypeControlPositionFix() {
  const map = useMap();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apply = useCallback(() => {
    if (!map) return;
    const div = map.getDiv();
    if (!div) return;
    const mtc = div.querySelector<HTMLElement>(".gm-style-mtc");
    if (!mtc) return;
    const inset = `${MAP_TYPE_CONTROL_INSET}px`;
    mtc.style.setProperty("position", "absolute", "important");
    mtc.style.setProperty("right", inset, "important");
    mtc.style.setProperty("top", inset, "important");
    mtc.style.setProperty("left", "auto", "important");
    mtc.style.setProperty("bottom", "auto", "important");
    mtc.style.setProperty("margin", "0", "important");
    mtc.style.setProperty("transform", "none", "important");
    mtc.style.zIndex = "1100";
    const menu = div.querySelector<HTMLElement>(".gm-style-mtc-bbw");
    if (menu) {
      menu.style.setProperty("left", "auto", "important");
      menu.style.setProperty("right", "0", "important");
      menu.style.setProperty("transform", "none", "important");
    }
  }, [map]);

  useEffect(() => {
    if (!map) return;
    const div = map.getDiv();
    if (!div) return;

    apply();
    const idleOnce = google.maps.event.addListenerOnce(map, "idle", apply);

    const schedule = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        apply();
      }, 80);
    };

    const mo = new MutationObserver(schedule);
    mo.observe(div, { childList: true, subtree: true });

    const ro = new ResizeObserver(schedule);
    ro.observe(div);

    return () => {
      google.maps.event.removeListener(idleOnce);
      mo.disconnect();
      ro.disconnect();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [map, apply]);

  return null;
}

/** panTarget が変わったときだけパン（カルーセルスワイプでは panTarget を更新しない） */
function MapPanToFocus({ building }: { building: Building | null }) {
  const map = useMap();
  const id = building?.id ?? null;
  const lat = building?.location.lat;
  const lng = building?.location.lng;

  useEffect(() => {
    if (!map || id == null || lat == null || lng == null) return;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    map.panTo({ lat, lng });
  }, [map, id, lat, lng]);

  return null;
}

/** Places 候補など、緯度経度だけパン（key が変わるたびに再実行） */
function MapPanToLatLng({
  target,
}: {
  target: { lat: number; lng: number; key: string } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !target) return;
    if (!Number.isFinite(target.lat) || !Number.isFinite(target.lng)) return;
    map.panTo({ lat: target.lat, lng: target.lng });
    map.setZoom(16);
  }, [map, target?.key, target?.lat, target?.lng]);

  return null;
}

function PendingPlaceMarker({
  position,
  title,
}: {
  position: { lat: number; lng: number };
  title?: string;
}) {
  const theme = useTheme();
  return (
    <AdvancedMarker position={position} title={title}>
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full border-4 shadow-lg"
        style={{
          borderColor: theme.palette.warning.main,
          backgroundColor: theme.palette.warning.light,
        }}
      >
        <MapPin
          className="size-6"
          style={{ color: theme.palette.warning.dark }}
        />
      </div>
    </AdvancedMarker>
  );
}

type BuildingMarkerProps = {
  building: Building;
  onRef: (index: number, marker: AdvancedMarkerElement | null) => void;
  index: number;
  onSelect: (building: Building) => void;
  selected: boolean;
};

function BuildingMarker({
  building,
  onRef,
  index,
  onSelect,
  selected,
}: BuildingMarkerProps) {
  const { src, onError } = useBuildingCoverImageSrc(building);
  const locale = useUiLocale();
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const title = pickLocalized(building.name, locale);
  return (
    <AdvancedMarker
      ref={(m) => onRef(index, m)}
      position={building.location}
      onClick={() => onSelect(building)}
      title={title}
    >
      <div
        className="overflow-hidden rounded-full border-2 shadow-md transition-transform hover:scale-110"
        style={{
          width: MARKER_SIZE,
          height: MARKER_SIZE,
          cursor: "pointer",
          borderColor: selected ? primary : "#ffffff",
          boxShadow: selected
            ? `0 0 0 3px ${primary}, 0 2px 8px rgba(0,0,0,0.25)`
            : undefined,
        }}
      >
        <Image
          src={src}
          alt=""
          width={MARKER_SIZE}
          height={MARKER_SIZE}
          className="block h-full w-full object-cover"
          onError={onError}
          sizes="48px"
        />
      </div>
    </AdvancedMarker>
  );
}

function MapMarkers({
  buildings,
  onSelect,
  selectedBuildingId,
}: {
  buildings: Building[];
  onSelect: (building: Building) => void;
  selectedBuildingId: string | null;
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
          selected={selectedBuildingId === b.id}
        />
      ))}
    </>
  );
}

/** モバイル: カルーセルは openDetail: false、ピンは true で詳細シートを開く */
export type BuildingSelectOptions = {
  openDetail?: boolean;
  /** false のとき地図をパンしない（カルーセルのみスワイプなど） */
  panMap?: boolean;
};

export type ArchitectureMapProps = {
  /** When provided, marker tap opens bottom sheet instead of navigating. */
  onBuildingSelect?: (
    building: Building,
    options?: BuildingSelectOptions,
  ) => void;
  /** 地図上の POI（施設アイコン）をクリックしたとき。placeId が取れた場合のみ呼ばれる */
  onPoiPlaceClick?: (placeId: string) => void | Promise<void>;
  /** Use buildings from parent (e.g. MapContainer) instead of fetching. */
  buildingsProp?: Building[] | null;
  /** If true, map fills the viewport (for map-first layout). */
  fullscreen?: boolean;
  /** 選択中の建築（マーカー強調） */
  selectedBuilding?: Building | null;
  /** この建築へだけパンする（カルーセルスワイプでは親が更新しない） */
  panTargetBuilding?: Building | null;
  /** Places 候補など、建築以外の位置へパン（key は placeId 等で一意に） */
  panTargetLatLng?: { lat: number; lng: number; key: string } | null;
  /** 未登録の登録候補（オレンジピン） */
  pendingPlaceMarker?: {
    lat: number;
    lng: number;
    title?: string;
  } | null;
};

export function ArchitectureMap({
  onBuildingSelect,
  onPoiPlaceClick,
  buildingsProp = null,
  fullscreen = false,
  selectedBuilding = null,
  panTargetBuilding = null,
  panTargetLatLng = null,
  pendingPlaceMarker = null,
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
      const list = await getBuildingsForMap();
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
      trackBuildingStat(building.id, "pin_click");
      if (onBuildingSelect) {
        onBuildingSelect(building, { openDetail: true, panMap: true });
      } else {
        router.push(`/buildings/${building.slug || building.id}`);
      }
    },
    [onBuildingSelect, router],
  );

  const handleMapClick = useCallback(
    (e: { detail: { placeId: string | null } }) => {
      const pid = e.detail.placeId?.trim();
      if (!pid || !onPoiPlaceClick) return;
      void onPoiPlaceClick(pid);
    },
    [onPoiPlaceClick],
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
          onClick={onPoiPlaceClick ? handleMapClick : undefined}
        >
          <MapControlsLayout />
          <MapTypeControlPositionFix />
          <MapPanToFocus building={panTargetBuilding} />
          <MapPanToLatLng target={panTargetLatLng} />
          {!loading && buildings.length > 0 && (
            <MapMarkers
              buildings={buildings}
              onSelect={handleSelect}
              selectedBuildingId={selectedBuilding?.id ?? null}
            />
          )}
          {pendingPlaceMarker &&
            Number.isFinite(pendingPlaceMarker.lat) &&
            Number.isFinite(pendingPlaceMarker.lng) && (
              <PendingPlaceMarker
                position={{
                  lat: pendingPlaceMarker.lat,
                  lng: pendingPlaceMarker.lng,
                }}
                title={pendingPlaceMarker.title}
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
