"use client";

import { BuildingDetailPanel } from "@/components/building-detail-panel";
import { MapSearchBar } from "@/components/map-search-bar";
import { getImageUrl } from "@/lib/constants";
import {
  getFavoriteBuildingIds,
  getRecentBuildingIds,
  getRecentSearchQueries,
  recordSearchQuery,
} from "@/lib/map-user-data";
import type { Building } from "@/types/building";
import Bookmark from "@mui/icons-material/Bookmark";
import History from "@mui/icons-material/History";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useState } from "react";

const RECENT_PREVIEW = 3;

const CARD_SHADOW =
  "0 1px 2px rgba(60,64,67,0.3), 0 2px 6px 2px rgba(60,64,67,0.15)";

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function BuildingListItems({
  items,
  onSelect,
  selectedId,
}: {
  items: Building[];
  onSelect: (b: Building) => void;
  selectedId?: string | null;
}) {
  return (
    <List disablePadding dense>
      {items.map((b) => (
        <ListItemButton
          key={b.id}
          alignItems="flex-start"
          selected={selectedId === b.id}
          onClick={() => onSelect(b)}
          sx={{ py: 1.5, px: 2 }}
        >
          <Box sx={{ mr: 1.5, mt: 0.25 }}>
            <Avatar
              variant="circular"
              sx={{
                width: 40,
                height: 40,
                bgcolor: "grey.300",
                color: "grey.600",
              }}
              src={getImageUrl(b.coverImageUrl)}
              alt=""
              imgProps={{
                onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.src = getImageUrl(null);
                },
              }}
            />
          </Box>
          <ListItemText
            primary={b.nameJa ?? b.name}
            secondary={b.architectName}
            primaryTypographyProps={{
              variant: "body2",
              fontWeight: 600,
              noWrap: true,
            }}
            secondaryTypographyProps={{
              variant: "caption",
              color: "text.secondary",
              noWrap: true,
            }}
          />
        </ListItemButton>
      ))}
    </List>
  );
}

export type MapSearchUiAreaProps = {
  buildings: Building[];
  selectedBuilding: Building | null;
  onSelectBuilding: (building: Building) => void;
  onClearSelection: () => void;
};

/**
 * 左上 fixed: Google 風に検索バーとパネルを一枚のカードで密着。候補と検索結果は同一リスト扱い。
 */
export function MapSearchUiArea({
  buildings,
  selectedBuilding,
  onSelectBuilding,
  onClearSelection,
}: MapSearchUiAreaProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userDataTick, setUserDataTick] = useState(0);
  const [savedOnly, setSavedOnly] = useState(false);
  const [recentExpanded, setRecentExpanded] = useState(false);

  useEffect(() => {
    const onChange = () => setUserDataTick((t) => t + 1);
    window.addEventListener("archinotes-user-data-changed", onChange);
    return () =>
      window.removeEventListener("archinotes-user-data-changed", onChange);
  }, []);

  useEffect(() => {
    if (selectedBuilding) {
      setPanelOpen(true);
    }
  }, [selectedBuilding]);

  const [recentSearchQueries, setRecentSearchQueries] = useState<string[]>([]);
  const [savedBuildings, setSavedBuildings] = useState<Building[]>([]);
  const [recentBuildings, setRecentBuildings] = useState<Building[]>([]);

  useEffect(() => {
    setRecentSearchQueries(getRecentSearchQueries());
  }, [userDataTick]);

  useEffect(() => {
    const ids = getFavoriteBuildingIds();
    const byId = new Map(buildings.map((b) => [b.id, b]));
    setSavedBuildings(
      ids.map((id) => byId.get(id)).filter((b): b is Building => b != null),
    );
  }, [buildings, userDataTick]);

  useEffect(() => {
    const ids = getRecentBuildingIds();
    const byId = new Map(buildings.map((b) => [b.id, b]));
    setRecentBuildings(
      ids.map((id) => byId.get(id)).filter((b): b is Building => b != null),
    );
  }, [buildings, userDataTick]);

  const [filtered, setFiltered] = useState<Building[]>(buildings);

  useEffect(() => {
    const q = normalize(searchQuery);
    const favIds = new Set(getFavoriteBuildingIds());
    let list = buildings;
    if (savedOnly) {
      list = list.filter((b) => favIds.has(b.id));
    }
    if (!q) {
      setFiltered(list);
      return;
    }
    setFiltered(
      list.filter((b) => {
        const hay = [
          b.name,
          b.nameJa,
          b.architectName,
          b.city,
          b.country,
          b.ward,
        ]
          .filter(Boolean)
          .join(" ");
        return normalize(hay).includes(q);
      }),
    );
  }, [buildings, searchQuery, savedOnly, userDataTick]);

  const displayValue = selectedBuilding
    ? (selectedBuilding.nameJa ?? selectedBuilding.name)
    : searchQuery;

  const openPanel = useCallback(() => setPanelOpen(true), []);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selectedBuilding) {
        onClearSelection();
        return;
      }
      closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedBuilding, onClearSelection, closePanel]);

  const handleSelectFromSearch = useCallback(
    (b: Building) => {
      const q = searchQuery.trim();
      if (q) recordSearchQuery(q);
      onSelectBuilding(b);
    },
    [searchQuery, onSelectBuilding],
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const q = searchQuery.trim();
      if (!q) return;
      recordSearchQuery(q);
      const first = filtered[0];
      if (first) {
        onSelectBuilding(first);
      }
    },
    [searchQuery, filtered, onSelectBuilding],
  );

  const handleClearBar = () => {
    if (selectedBuilding) {
      onClearSelection();
    } else {
      setSearchQuery("");
    }
  };

  const recentShown = recentExpanded
    ? recentBuildings
    : recentBuildings.slice(0, RECENT_PREVIEW);

  const showResultsMode = searchQuery.trim().length > 0;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 16,
        left: 16,
        width: 420,
        maxWidth: "min(420px, calc(100vw - 32px))",
        zIndex: 1300,
        pointerEvents: "none",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          pointerEvents: "auto",
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: CARD_SHADOW,
          bgcolor: "background.paper",
        }}
      >
        <MapSearchBar
          variant="cardTop"
          value={displayValue}
          placeholder="ArchiNotes を検索"
          readOnly={!!selectedBuilding}
          onChange={(v) => {
            setSearchQuery(v);
            setPanelOpen(true);
          }}
          onFocus={openPanel}
          onKeyDown={selectedBuilding ? undefined : handleSearchKeyDown}
          showClear={!!selectedBuilding || !!searchQuery.trim()}
          onClear={handleClearBar}
          hideDirections
        />

        <Stack
          direction="row"
          flexWrap="wrap"
          gap={0.75}
          sx={{
            px: 1.5,
            py: 1,
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "grey.50",
          }}
        >
          <Chip
            size="small"
            label="保存済みのみ"
            onClick={() => {
              setSavedOnly((v) => !v);
              openPanel();
            }}
            color={savedOnly ? "primary" : "default"}
            variant={savedOnly ? "filled" : "outlined"}
          />
        </Stack>

        <Collapse in={panelOpen} timeout="auto">
          <Box
            sx={{
              maxHeight: "min(calc(100vh - 140px), 560px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="flex-end"
              sx={{
                px: 1.5,
                py: 0.75,
                flexShrink: 0,
                bgcolor: "grey.50",
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <Button
                size="small"
                onClick={closePanel}
                color="primary"
                sx={{ textTransform: "none", fontWeight: 500 }}
              >
                閉じる
              </Button>
            </Stack>

            <Box sx={{ overflow: "auto", flex: 1, minHeight: 0 }}>
              {selectedBuilding ? (
                <BuildingDetailPanel
                  building={selectedBuilding}
                  onBack={onClearSelection}
                  hideBackButton
                  embedVariant="mapPlace"
                />
              ) : showResultsMode ? (
                filtered.length === 0 ? (
                  <Box sx={{ px: 2, py: 4 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                    >
                      該当する建築がありません
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Box sx={{ px: 2, pt: 2, pb: 0.5 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 500 }}
                      >
                        検索・候補（{filtered.length}件）
                      </Typography>
                    </Box>
                    <BuildingListItems
                      items={filtered}
                      onSelect={handleSelectFromSearch}
                      selectedId={null}
                    />
                  </>
                )
              ) : (
                <>
                  {recentSearchQueries.length > 0 && (
                    <>
                      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
                        <Typography
                          variant="body1"
                          sx={{ mb: 1, fontWeight: 600, fontSize: "1rem" }}
                        >
                          最近の検索
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={0.75}>
                          {recentSearchQueries.map((q) => (
                            <Chip
                              key={q}
                              size="small"
                              label={q}
                              onClick={() => {
                                setSearchQuery(q);
                                setPanelOpen(true);
                              }}
                              variant="outlined"
                            />
                          ))}
                        </Stack>
                      </Box>
                      <Divider />
                    </>
                  )}

                  <Box
                    sx={{
                      px: 2,
                      py: 2,
                      pt: recentSearchQueries.length ? 1.5 : 2,
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{ mb: 1.25, fontWeight: 600, fontSize: "1rem" }}
                    >
                      保存した建築
                    </Typography>
                    {savedBuildings.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        保存した建築はありません。詳細から保存できます。
                      </Typography>
                    ) : (
                      <List disablePadding dense>
                        {savedBuildings.map((b) => (
                          <ListItemButton
                            key={b.id}
                            alignItems="flex-start"
                            onClick={() => handleSelectFromSearch(b)}
                            sx={{ py: 1.25, px: 0, borderRadius: 1 }}
                          >
                            <Bookmark
                              sx={{ color: "primary.main", mr: 2, mt: 0.25 }}
                              fontSize="small"
                            />
                            <ListItemText
                              primary={b.nameJa ?? b.name}
                              secondary={b.architectName}
                              primaryTypographyProps={{
                                variant: "body2",
                                fontWeight: 600,
                              }}
                              secondaryTypographyProps={{
                                variant: "caption",
                                color: "text.secondary",
                              }}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    )}
                  </Box>

                  <Divider />

                  <Box sx={{ px: 2, py: 2 }}>
                    <Typography
                      variant="body1"
                      sx={{ mb: 1.25, fontWeight: 600, fontSize: "1rem" }}
                    >
                      最近開いた建築
                    </Typography>
                    {recentBuildings.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        まだ履歴がありません。
                      </Typography>
                    ) : (
                      <>
                        <List disablePadding dense>
                          {recentShown.map((b) => (
                            <ListItemButton
                              key={b.id}
                              alignItems="flex-start"
                              onClick={() => handleSelectFromSearch(b)}
                              sx={{ py: 1.25, px: 0, borderRadius: 1 }}
                            >
                              <History
                                sx={{
                                  color: "text.secondary",
                                  mr: 2,
                                  mt: 0.25,
                                }}
                                fontSize="small"
                              />
                              <ListItemText
                                primary={b.nameJa ?? b.name}
                                secondary={[b.city, b.country]
                                  .filter(Boolean)
                                  .join(" · ")}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  fontWeight: 600,
                                }}
                                secondaryTypographyProps={{
                                  variant: "caption",
                                  color: "text.secondary",
                                }}
                              />
                            </ListItemButton>
                          ))}
                        </List>
                        {recentBuildings.length > RECENT_PREVIEW && (
                          <Button
                            size="small"
                            onClick={() => setRecentExpanded((e) => !e)}
                            sx={{ mt: 0.5, textTransform: "none" }}
                          >
                            {recentExpanded
                              ? "履歴を閉じる"
                              : "最近の履歴をもっと見る"}
                          </Button>
                        )}
                      </>
                    )}
                  </Box>

                  <Divider />

                  <Box sx={{ px: 2, py: 2, pb: 2.5 }}>
                    <Typography
                      variant="body1"
                      sx={{ mb: 0.75, fontWeight: 600, fontSize: "1rem" }}
                    >
                      検索・候補
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1.25, lineHeight: 1.5 }}
                    >
                      上の欄に入力すると絞り込み、未入力時は登録建築からの候補です。
                    </Typography>
                    <BuildingListItems
                      items={buildings.slice(0, 8)}
                      onSelect={handleSelectFromSearch}
                      selectedId={null}
                    />
                  </Box>
                </>
              )}
            </Box>
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
}
