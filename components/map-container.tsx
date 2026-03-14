"use client";

import { ArchitectureMap } from "@/components/architecture-map";
import { BuildingBottomSheet } from "@/components/building-bottom-sheet";
import { getLocalBuildings, getPublishedBuildings } from "@/lib/buildings";
import type { Building } from "@/types/building";
import { useCallback, useEffect, useState } from "react";

/**
 * Map-first layout: fullscreen map + bottom sheet for building details.
 * Tapping a marker opens the sheet; user can switch buildings or close and keep exploring.
 */
export function MapContainer() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(
    null,
  );

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

  const handleBuildingSelect = useCallback((building: Building) => {
    setSelectedBuilding(building);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSelectedBuilding(null);
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <ArchitectureMap
        fullscreen
        buildingsProp={loading ? null : buildings}
        onBuildingSelect={handleBuildingSelect}
      />
      <BuildingBottomSheet
        building={selectedBuilding}
        onClose={handleCloseSheet}
      />
    </div>
  );
}
