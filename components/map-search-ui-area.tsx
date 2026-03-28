"use client";

import { BuildingDetailPanel } from "@/components/building-detail-panel";
import { MapSearchBar } from "@/components/map-search-bar";
import { useBuildingCoverImageSrc } from "@/hooks/use-building-cover-image";
import { trackBuildingStat } from "@/lib/building-stats";
import {
  getFavoriteBuildingIds,
  getRecentBuildingIds,
  getRecentSearchQueries,
  recordSearchQuery,
} from "@/lib/map-user-data";
import type { Building } from "@/types/building";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import Bookmark from "@mui/icons-material/Bookmark";
import History from "@mui/icons-material/History";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const PLACES_DEBOUNCE_MS = 350;
const PLACES_MIN_CHARS = 3;

const RECENT_PREVIEW = 3;

const CARD_SHADOW =
  "0 1px 2px rgba(60,64,67,0.3), 0 2px 6px 2px rgba(60,64,67,0.15)";

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function BuildingSearchAvatar({ building }: { building: Building }) {
  const { src, onError } = useBuildingCoverImageSrc(building);
  return (
    <Avatar
      variant="circular"
      sx={{
        width: 40,
        height: 40,
        bgcolor: "grey.300",
        color: "grey.600",
      }}
      src={src}
      alt=""
      imgProps={{
        onError,
      }}
    />
  );
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
            <BuildingSearchAvatar building={b} />
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
  /** Google 候補タップ時: 地図へパン＋未登録なら候補表示（登録画面は別ボタン） */
  onGooglePlacePreview?: (placeId: string) => void | Promise<void>;
  placePreview?: {
    placeId: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
  } | null;
  onClearPlacePreview?: () => void;
};

/**
 * 左上 fixed: Google 風に検索バーとパネルを一枚のカードで密着。候補と検索結果は同一リスト扱い。
 */
export function MapSearchUiArea({
  buildings,
  selectedBuilding,
  onSelectBuilding,
  onClearSelection,
  onGooglePlacePreview,
  placePreview = null,
  onClearPlacePreview,
}: MapSearchUiAreaProps) {
  const router = useRouter();
  const [panelOpen, setPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, PLACES_DEBOUNCE_MS);
  const [userDataTick, setUserDataTick] = useState(0);
  const [savedOnly, setSavedOnly] = useState(false);
  const [placesSuggestions, setPlacesSuggestions] = useState<
    Array<{ placeId: string; mainText: string; secondaryText?: string }>
  >([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState(false);
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

  useEffect(() => {
    const q = debouncedSearchQuery.trim();
    if (q.length < PLACES_MIN_CHARS) {
      setPlacesSuggestions([]);
      setPlacesError(false);
      setPlacesLoading(false);
      return;
    }
    const ac = new AbortController();
    setPlacesLoading(true);
    setPlacesError(false);
    fetch(`/api/places-autocomplete?q=${encodeURIComponent(q)}`, {
      signal: ac.signal,
    })
      .then((r) => r.json())
      .then(
        (data: {
          suggestions?: Array<{
            placeId: string;
            mainText: string;
            secondaryText?: string;
          }>;
        }) => {
          if (ac.signal.aborted) return;
          setPlacesSuggestions(data.suggestions ?? []);
        },
      )
      .catch(() => {
        if (ac.signal.aborted) return;
        setPlacesError(true);
        setPlacesSuggestions([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setPlacesLoading(false);
      });
    return () => ac.abort();
  }, [debouncedSearchQuery]);

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
      if (q) {
        recordSearchQuery(q);
        trackBuildingStat(b.id, "search_hit");
      }
      onSelectBuilding(b);
    },
    [searchQuery, onSelectBuilding],
  );

  const handleSelectGooglePlace = useCallback(
    async (placeId: string) => {
      const pid = placeId.trim();
      const existing = buildings.find(
        (b) => b.googlePlaceId?.trim() === pid,
      );
      const q = searchQuery.trim();
      if (q) recordSearchQuery(q);
      if (existing) {
        trackBuildingStat(existing.id, "search_hit");
        onSelectBuilding(existing);
        setPanelOpen(false);
        return;
      }
      if (onGooglePlacePreview) {
        await onGooglePlacePreview(pid);
        return;
      }
      router.push(`/buildings/new?placeId=${encodeURIComponent(pid)}`);
    },
    [buildings, searchQuery, onSelectBuilding, onGooglePlacePreview, router],
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const q = searchQuery.trim();
      if (!q) return;
      recordSearchQuery(q);
      const first = filtered[0];
      if (first) {
        trackBuildingStat(first.id, "search_hit");
        onSelectBuilding(first);
      }
    },
    [searchQuery, filtered, onSelectBuilding],
  );

  /** 検索文字を優先してクリア。空なら選択のみ解除（地図フォーカス変更で検索文は変えない） */
  const handleClearBar = () => {
    if (searchQuery.trim()) {
      setSearchQuery("");
      return;
    }
    if (selectedBuilding) {
      onClearSelection();
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
          value={searchQuery}
          placeholder="ArchiNotes を検索"
          onChange={(v) => {
            setSearchQuery(v);
            setPanelOpen(true);
          }}
          onFocus={openPanel}
          onKeyDown={handleSearchKeyDown}
          showClear={!!searchQuery.trim() || !!selectedBuilding}
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
              ) : (
                <>
                  {/*
                    検索欄を空にすると showResultsMode が false になるが、
                    placePreview（オレンジピン）は残る。このブロックは常に出し、登録導線を消さない。
                  */}
                  {placePreview && onClearPlacePreview && (
                    <Box
                      sx={{
                        px: 2,
                        py: 2,
                        bgcolor: "action.hover",
                        borderBottom: 1,
                        borderColor: "divider",
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        地図上の登録候補
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {placePreview.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 0.25 }}
                      >
                        {placePreview.address}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 1 }}
                      >
                        地図のオレンジのピンで位置を確認し、問題なければ登録へ進んでください。
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ mt: 1.5 }}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        <Button
                          component={Link}
                          href={`/buildings/new?placeId=${encodeURIComponent(placePreview.placeId)}`}
                          variant="contained"
                          size="small"
                          sx={{ textTransform: "none" }}
                        >
                          この場所を登録する
                        </Button>
                        <Button
                          size="small"
                          onClick={onClearPlacePreview}
                          sx={{ textTransform: "none" }}
                        >
                          候補を消す
                        </Button>
                      </Stack>
                    </Box>
                  )}
                  {showResultsMode ? (
                <>
                  <Box sx={{ px: 2, pt: 2, pb: 0.5 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontWeight: 600 }}
                    >
                      ArchiNotes の建築（{filtered.length}件）
                    </Typography>
                  </Box>
                  {filtered.length === 0 ? (
                    <Box sx={{ px: 2, py: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        該当する建築がありません
                      </Typography>
                    </Box>
                  ) : (
                    <BuildingListItems
                      items={filtered}
                      onSelect={handleSelectFromSearch}
                      selectedId={null}
                    />
                  )}

                  <Divider sx={{ my: 0.5 }} />

                  <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontWeight: 600 }}
                    >
                      Google の候補
                    </Typography>
                  </Box>
                  {searchQuery.trim().length < PLACES_MIN_CHARS ? (
                    <Box sx={{ px: 2, pb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {PLACES_MIN_CHARS}
                        文字以上で Google の候補を取得します。
                      </Typography>
                    </Box>
                  ) : placesLoading ? (
                    <Box
                      sx={{
                        px: 2,
                        py: 3,
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <CircularProgress size={26} />
                    </Box>
                  ) : placesError ? (
                    <Box sx={{ px: 2, pb: 2 }}>
                      <Typography variant="body2" color="error">
                        Google の候補を取得できませんでした。
                      </Typography>
                    </Box>
                  ) : placesSuggestions.length === 0 ? (
                    <Box sx={{ px: 2, pb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        該当する場所がありません
                      </Typography>
                    </Box>
                  ) : (
                    <List disablePadding dense>
                      {placesSuggestions.map((p) => (
                        <ListItemButton
                          key={p.placeId}
                          alignItems="flex-start"
                          onClick={() => handleSelectGooglePlace(p.placeId)}
                          sx={{ py: 1.5, px: 2 }}
                        >
                          <PlaceOutlined
                            sx={{
                              color: "primary.main",
                              mr: 1.5,
                              mt: 0.25,
                              fontSize: 22,
                            }}
                          />
                          <ListItemText
                            primary={p.mainText}
                            secondary={p.secondaryText}
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
                  )}
                </>
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
                </>
              )}
            </Box>
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
}
