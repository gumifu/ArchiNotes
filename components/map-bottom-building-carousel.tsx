"use client";

import { useBuildingCoverImageSrc } from "@/hooks/use-building-cover-image";
import type { Building } from "@/types/building";
import ChevronRight from "@mui/icons-material/ChevronRight";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useLayoutEffect, useRef } from "react";

const GAP = 12;

function CarouselCardThumbnail({ building }: { building: Building }) {
  const { src, onError } = useBuildingCoverImageSrc(building);
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt=""
      style={{
        width: "100%",
        height: "100%",
        minHeight: 120,
        objectFit: "cover",
      }}
      onError={onError}
    />
  );
}

export type MapBottomBuildingCarouselProps = {
  buildings: Building[];
  selectedBuilding: Building | null;
  /** カードタップで詳細シートを開く */
  onCardDetailTap: (building: Building) => void;
};

/**
 * 地図下部（固定）: 横スクロールの建築カード（1枚時はほぼ全幅）。PC でも表示。
 */
export function MapBottomBuildingCarousel({
  buildings,
  selectedBuilding,
  onCardDetailTap,
}: MapBottomBuildingCarouselProps) {
  const theme = useTheme();
  const scrollerRef = useRef<HTMLDivElement>(null);

  const selectedId = selectedBuilding?.id ?? null;

  /** ピンなどで選択が変わったときだけ、該当カードをビューポート中央へ。横スクロールでは選択は変えない */
  useLayoutEffect(() => {
    const root = scrollerRef.current;
    if (!root || !selectedId) return;
    const card = root.querySelector<HTMLElement>(
      `[data-card-id="${selectedId}"]`,
    );
    if (!card) return;
    const targetLeft =
      card.offsetLeft + card.offsetWidth / 2 - root.clientWidth / 2;
    root.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: "smooth",
    });
  }, [selectedId, buildings]);

  if (buildings.length === 0) return null;

  const single = buildings.length === 1;

  return (
    <Box
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: theme.zIndex.appBar,
        pointerEvents: "none",
        pb: "max(12px, env(safe-area-inset-bottom, 0px))",
        background:
          "linear-gradient(to top, rgba(0,0,0,0.12) 0%, transparent 100%)",
      }}
    >
      <Box
        ref={scrollerRef}
        sx={{
          display: "flex",
          gap: `${GAP}px`,
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          px: 2,
          pb: 1,
          pointerEvents: "auto",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {buildings.map((b) => {
          const title = b.nameJa ?? b.name;
          const selected = selectedBuilding?.id === b.id;
          return (
            <Box
              key={b.id}
              data-card-id={b.id}
              sx={{
                flex: "0 0 auto",
                width: single ? "calc(100vw - 32px)" : "min(85vw, 360px)",
                maxWidth: single ? "calc(100vw - 32px)" : undefined,
                minWidth: 0,
                scrollSnapAlign: "center",
              }}
            >
              <Paper
                elevation={3}
                onClick={() => onCardDetailTap(b)}
                sx={{
                  height: "100%",
                  borderRadius: 2,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "stretch",
                  cursor: "pointer",
                  outline: selected ? 2 : 0,
                  outlineColor: "primary.main",
                  outlineOffset: 2,
                  transition: "outline-width 0.15s ease",
                }}
              >
                <Box
                  sx={{
                    width: 112,
                    flexShrink: 0,
                    bgcolor: "grey.200",
                    position: "relative",
                  }}
                >
                  <CarouselCardThumbnail building={b} />
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    py: 1.25,
                    pr: 1,
                    pl: 1.5,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    noWrap
                    sx={{ lineHeight: 1.3 }}
                  >
                    {title}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    sx={{ display: "block", mt: 0.25 }}
                  >
                    {[b.architectName, b.city].filter(Boolean).join(" · ")}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mt: 0.75,
                      color: "primary.main",
                    }}
                  >
                    <Typography variant="caption" fontWeight={600}>
                      詳細を見る
                    </Typography>
                    <ChevronRight sx={{ fontSize: 16 }} />
                  </Box>
                </Box>
              </Paper>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
