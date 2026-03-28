"use client";

import type { BuildingSelectOptions } from "@/components/architecture-map";
import { ArchitectureMap } from "@/components/architecture-map";
import { BuildingDetailPanel } from "@/components/building-detail-panel";
import { MapBottomBuildingCarousel } from "@/components/map-bottom-building-carousel";
import { MapExplorerPanel } from "@/components/map-explorer-panel";
import { MapSearchUiArea } from "@/components/map-search-ui-area";
import { getLocalBuildings, getPublishedBuildings } from "@/lib/buildings";
import { recordBuildingOpened } from "@/lib/map-user-data";
import type { Building } from "@/types/building";
import Menu from "@mui/icons-material/Menu";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useCallback, useEffect, useState } from "react";

/**
 * 広い画面(lg以上): 左上 fixed の検索 UI + 下部カルーセル。
 * lg 未満: 地図全画面 + 下部カルーセル + メニューで一覧、詳細はシート。
 */
export function MapContainer() {
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

  const fetchBuildings = useCallback(async () => {
    const useFirestore = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!useFirestore) {
      setBuildings(getLocalBuildings());
      setLoading(false);
      return;
    }
    try {
      const list = await getPublishedBuildings();
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

  const handleClearSelection = useCallback(() => {
    setSelectedBuilding(null);
    setPanTargetBuilding(null);
    setMobileDetailOpen(false);
  }, []);

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
            buildings={buildings}
            selectedBuilding={selectedBuilding}
            onSelectBuilding={handleBuildingSelect}
            onClearSelection={handleClearSelection}
          />
        )}

        {isMapCompact && (
          <IconButton
            aria-label="建築一覧を開く"
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

        <ArchitectureMap
          fullscreen
          buildingsProp={loading ? null : buildings}
          onBuildingSelect={handleBuildingSelect}
          selectedBuilding={selectedBuilding}
          panTargetBuilding={panTargetBuilding}
        />

        {!loading && buildings.length > 0 && (
          <MapBottomBuildingCarousel
            buildings={buildings}
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
              buildings={buildings}
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
                },
              },
            }}
          >
            {selectedBuilding && (
              <BuildingDetailPanel
                building={selectedBuilding}
                onClose={handleCloseMobileDetail}
                showPuller
              />
            )}
          </SwipeableDrawer>
        </>
      )}
    </Box>
  );
}
