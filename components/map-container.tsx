"use client";

import { ArchitectureMap } from "@/components/architecture-map";
import { BuildingDetailPanel } from "@/components/building-detail-panel";
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
 * デスクトップ: 地図全面 + 左上 fixed の検索 UI。
 * モバイル: 地図全画面 + メニューで一覧、ピン選択時は下部シート。
 */
export function MapContainer() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(
    null,
  );
  const [mobileListOpen, setMobileListOpen] = useState(false);

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
    (building: Building) => {
      recordBuildingOpened(building.id);
      setSelectedBuilding(building);
      if (isMobile) {
        setMobileListOpen(false);
      }
    },
    [isMobile],
  );

  const handleClearSelection = useCallback(() => {
    setSelectedBuilding(null);
  }, []);

  const handleCloseMobileDetail = useCallback(() => {
    setSelectedBuilding(null);
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
        {!isMobile && (
          <MapSearchUiArea
            buildings={buildings}
            selectedBuilding={selectedBuilding}
            onSelectBuilding={handleBuildingSelect}
            onClearSelection={handleClearSelection}
          />
        )}

        {isMobile && (
          <IconButton
            aria-label="建築一覧を開く"
            onClick={() => setMobileListOpen(true)}
            sx={{
              position: "absolute",
              top: 12,
              left: 12,
              zIndex: 2,
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
        />
      </Box>

      {isMobile && (
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
              onSelectBuilding={handleBuildingSelect}
            />
          </Drawer>

          <SwipeableDrawer
            anchor="bottom"
            open={selectedBuilding != null}
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
