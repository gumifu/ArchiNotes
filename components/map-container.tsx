"use client";

import type { BuildingSelectOptions } from "@/components/architecture-map";
import { ArchitectureMap } from "@/components/architecture-map";
import { BuildingDetailPanel } from "@/components/building-detail-panel";
import { MapBottomCarouselSkeleton } from "@/components/loading-skeletons";
import { MapBottomBuildingCarousel } from "@/components/map-bottom-building-carousel";
import { MapExplorerPanel } from "@/components/map-explorer-panel";
import { MapSearchUiArea } from "@/components/map-search-ui-area";
import { getBuildingsForMap, getLocalBuildings } from "@/lib/buildings";
import { BUILDING_OVERRIDE_EVENT, mergeBuildingWithOverrides } from "@/lib/building-local-storage";
import { useUiLocale } from "@/hooks/use-ui-locale";
import { appUiStrings } from "@/lib/app-ui-strings";
import { recordBuildingOpened } from "@/lib/map-user-data";
import type { Building } from "@/types/building";
import Menu from "@mui/icons-material/Menu";
import Settings from "@mui/icons-material/Settings";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import Link from "next/link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * 広い画面(lg以上): 左上 fixed の検索 UI + 下部カルーセル。
 * lg 未満: 地図全画面 + 下部カルーセル + メニューで一覧、詳細はシート。
 */
export function MapContainer() {
  const uiLocale = useUiLocale();
  const ui = appUiStrings(uiLocale);
  const theme = useTheme();
  /** SSR と初回クライアントで useMediaQuery がずれるとハイドレーション不一致になるため、マウント後だけコンパクト判定を使う */
  const [layoutReady, setLayoutReady] = useState(false);
  useEffect(() => {
    setLayoutReady(true);
  }, []);
  const isMapCompactQuery = useMediaQuery(theme.breakpoints.down("lg"), {
    noSsr: true,
  });
  const isMapCompact = layoutReady && isMapCompactQuery;

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(
    null,
  );
  /** カルーセルスワイプでは更新しない。パンはこの参照が変わったときだけ */
  const [panTargetBuilding, setPanTargetBuilding] = useState<Building | null>(
    null,
  );
  const [mobileListOpen, setMobileListOpen] = useState(false);
  /** ピン／一覧／カードタップで true。カルーセルのみスワイプでは false のまま */
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [overrideEpoch, setOverrideEpoch] = useState(0);
  const [placePreview, setPlacePreview] = useState<{
    placeId: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [panTargetLatLng, setPanTargetLatLng] = useState<{
    lat: number;
    lng: number;
    key: string;
  } | null>(null);

  useEffect(() => {
    const bump = () => setOverrideEpoch((n) => n + 1);
    window.addEventListener(BUILDING_OVERRIDE_EVENT, bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener(BUILDING_OVERRIDE_EVENT, bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  const mergedBuildings = useMemo(
    () => buildings.map((b) => mergeBuildingWithOverrides(b)),
    [buildings, overrideEpoch],
  );

  useEffect(() => {
    setSelectedBuilding((prev) =>
      prev ? mergeBuildingWithOverrides(prev) : null,
    );
  }, [overrideEpoch]);

  const fetchBuildings = useCallback(async () => {
    const useFirestore = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!useFirestore) {
      setBuildings(getLocalBuildings());
      setLoading(false);
      return;
    }
    try {
      const list = await getBuildingsForMap();
      setBuildings(list);
    } catch {
      setBuildings(getLocalBuildings());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  const handleBuildingSelect = useCallback(
    (building: Building, options?: BuildingSelectOptions) => {
      setPlacePreview(null);
      setPanTargetLatLng(null);
      recordBuildingOpened(building.id);
      setSelectedBuilding(building);
      if (options?.panMap !== false) {
        setPanTargetBuilding(building);
      }
      if (isMapCompact) {
        setMobileListOpen(false);
        if (options?.openDetail !== false) {
          setMobileDetailOpen(true);
        } else {
          setMobileDetailOpen(false);
        }
      }
    },
    [isMapCompact],
  );

  const clearPlacePreview = useCallback(() => {
    setPlacePreview(null);
    setPanTargetLatLng(null);
  }, []);

  const handleGooglePlacePreview = useCallback(
    async (placeId: string) => {
      const pid = placeId.trim();
      const existing = mergedBuildings.find(
        (b) => b.googlePlaceId?.trim() === pid,
      );
      if (existing) {
        clearPlacePreview();
        handleBuildingSelect(existing);
        return;
      }
      const res = await fetch(
        `/api/places-prefill?placeId=${encodeURIComponent(pid)}`,
      );
      if (!res.ok) {
        clearPlacePreview();
        return;
      }
      const data = (await res.json()) as {
        place_id: string;
        name: string | { ja: string; en: string };
        address: string | { ja: string; en: string };
        lat: number;
        lng: number;
      };
      const nameStr =
        typeof data.name === "string"
          ? data.name
          : uiLocale === "ja"
            ? [data.name?.ja, data.name?.en].find((s) => s?.trim()) ?? ""
            : [data.name?.en, data.name?.ja].find((s) => s?.trim()) ?? "";
      const addrStr =
        typeof data.address === "string"
          ? data.address
          : uiLocale === "ja"
            ? [data.address?.ja, data.address?.en].find((s) => s?.trim()) ??
              ""
            : [data.address?.en, data.address?.ja].find((s) => s?.trim()) ??
              "";
      setPlacePreview({
        placeId: data.place_id,
        name: nameStr,
        address: addrStr,
        lat: data.lat,
        lng: data.lng,
      });
      setPanTargetLatLng({
        lat: data.lat,
        lng: data.lng,
        key: data.place_id,
      });
      setSelectedBuilding(null);
      setPanTargetBuilding(null);
      setMobileDetailOpen(false);
    },
    [mergedBuildings, handleBuildingSelect, clearPlacePreview, uiLocale],
  );

  const handleClearSelection = useCallback(() => {
    setSelectedBuilding(null);
    setPanTargetBuilding(null);
    setMobileDetailOpen(false);
    clearPlacePreview();
  }, [clearPlacePreview]);

  const handleCloseMobileDetail = useCallback(() => {
    setMobileDetailOpen(false);
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          position: "relative",
        }}
      >
        {!isMapCompact && (
          <MapSearchUiArea
            buildings={mergedBuildings}
            selectedBuilding={selectedBuilding}
            onSelectBuilding={handleBuildingSelect}
            onClearSelection={handleClearSelection}
            onGooglePlacePreview={handleGooglePlacePreview}
            placePreview={placePreview}
            onClearPlacePreview={clearPlacePreview}
          />
        )}

        {isMapCompact && (
          <IconButton
            aria-label={ui.mapOpenListAria}
            onClick={() => setMobileListOpen(true)}
            sx={{
              position: "absolute",
              top: 12,
              left: 12,
              zIndex: (t) => t.zIndex.appBar + 1,
              bgcolor: "background.paper",
              boxShadow: 2,
              "&:hover": { bgcolor: "background.paper" },
            }}
            size="large"
          >
            <Menu />
          </IconButton>
        )}

        <Stack
          direction="row"
          spacing={1}
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: (t) => t.zIndex.appBar + 1,
            alignItems: "center",
          }}
        >
          <IconButton
            component={Link}
            href="/settings"
            aria-label={uiLocale === "en" ? "Settings" : "設定"}
            sx={{
              bgcolor: "background.paper",
              boxShadow: 2,
              "&:hover": { bgcolor: "background.paper" },
            }}
            size="small"
          >
            <Settings fontSize="small" />
          </IconButton>
          <Button
            component={Link}
            href="/buildings/new"
            variant="outlined"
            size="small"
            sx={{
              bgcolor: "background.paper",
              boxShadow: 2,
              "&:hover": { bgcolor: "background.paper" },
            }}
          >
            {uiLocale === "en" ? "Add building" : "建築を登録"}
          </Button>
        </Stack>

        <ArchitectureMap
          fullscreen
          buildingsProp={loading ? null : mergedBuildings}
          onBuildingSelect={handleBuildingSelect}
          onPoiPlaceClick={handleGooglePlacePreview}
          selectedBuilding={selectedBuilding}
          panTargetBuilding={panTargetBuilding}
          panTargetLatLng={panTargetLatLng}
          pendingPlaceMarker={
            placePreview
              ? {
                  lat: placePreview.lat,
                  lng: placePreview.lng,
                  title: placePreview.name,
                }
              : null
          }
        />

        {isMapCompact && placePreview && (
          <Paper
            elevation={4}
            sx={{
              position: "fixed",
              left: 16,
              right: 16,
              bottom: "calc(140px + env(safe-area-inset-bottom, 0px))",
              zIndex: (t) => t.zIndex.appBar + 1,
              p: 2,
              pointerEvents: "auto",
              borderRadius: 2,
            }}
          >
            <Typography variant="subtitle2" fontWeight={600}>
              {uiLocale === "en"
                ? "Suggested place"
                : "地図上の登録候補"}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5, mb: 1.5 }}
            >
              {placePreview.name}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                component={Link}
                href={`/buildings/new?placeId=${encodeURIComponent(placePreview.placeId)}`}
                variant="contained"
                size="small"
              >
                {uiLocale === "en" ? "Register this place" : "この場所を登録する"}
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={clearPlacePreview}
              >
                {uiLocale === "en" ? "Dismiss" : "閉じる"}
              </Button>
            </Stack>
          </Paper>
        )}

        {loading && <MapBottomCarouselSkeleton />}
        {!loading && mergedBuildings.length > 0 && (
          <MapBottomBuildingCarousel
            buildings={mergedBuildings}
            selectedBuilding={selectedBuilding}
            onCardDetailTap={(b) =>
              handleBuildingSelect(b, { openDetail: true })
            }
          />
        )}
      </Box>

      {isMapCompact && (
        <>
          <Drawer
            anchor="left"
            open={mobileListOpen}
            onClose={() => setMobileListOpen(false)}
            slotProps={{
              paper: {
                sx: {
                  width: "min(100vw - 48px, 360px)",
                  maxWidth: "100%",
                },
              },
            }}
          >
            <MapExplorerPanel
              buildings={mergedBuildings}
              selectedBuilding={selectedBuilding}
              onSelectBuilding={(b) =>
                handleBuildingSelect(b, { openDetail: true })
              }
            />
          </Drawer>

          <SwipeableDrawer
            anchor="bottom"
            open={mobileDetailOpen && selectedBuilding != null}
            onClose={handleCloseMobileDetail}
            onOpen={() => {}}
            disableSwipeToOpen
            slotProps={{
              paper: {
                sx: {
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                  maxHeight: "min(85vh, 640px)",
                  height: "min(85vh, 640px)",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                },
              },
            }}
          >
            {selectedBuilding && (
              <BuildingDetailPanel
                building={selectedBuilding}
                onClose={handleCloseMobileDetail}
              />
            )}
          </SwipeableDrawer>
        </>
      )}
    </Box>
  );
}
