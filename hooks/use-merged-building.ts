"use client";

import {
  BUILDING_OVERRIDE_EVENT,
  mergeBuildingWithOverrides,
} from "@/lib/building-local-storage";
import type { Building } from "@/types/building";
import { useEffect, useState } from "react";

/**
 * サーバー由来の building に localStorage の上書きを反映（詳細ページ・編集フォーム用）。
 */
export function useMergedBuilding(building: Building): Building {
  const [merged, setMerged] = useState(building);

  useEffect(() => {
    setMerged(mergeBuildingWithOverrides(building));
  }, [building]);

  useEffect(() => {
    const sync = () => setMerged(mergeBuildingWithOverrides(building));
    window.addEventListener(BUILDING_OVERRIDE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(BUILDING_OVERRIDE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [building]);

  return merged;
}
