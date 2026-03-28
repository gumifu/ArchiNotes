"use client";

import { getImageUrl } from "@/lib/constants";
import {
  isFavoriteBuildingId,
  toggleFavoriteBuildingId,
} from "@/lib/map-user-data";
import type { Building } from "@/types/building";
import ArrowBack from "@mui/icons-material/ArrowBack";
import Bookmark from "@mui/icons-material/Bookmark";
import BookmarkBorder from "@mui/icons-material/BookmarkBorder";
import Close from "@mui/icons-material/Close";
import Directions from "@mui/icons-material/Directions";
import Explore from "@mui/icons-material/Explore";
import OpenInNew from "@mui/icons-material/OpenInNew";
import PhotoLibrary from "@mui/icons-material/PhotoLibrary";
import Share from "@mui/icons-material/Share";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const SUMMARY_COLLAPSE_CHARS = 280;

export type BuildingDetailPanelProps = {
  building: Building;
  /** 一覧へ戻る（デスクトップサイドバー用） */
  onBack?: () => void;
  /** 閉じる（モバイル下部ドロワー用） */
  onClose?: () => void;
  /** 上部にドラッグ用の取っ手を表示（モバイル） */
  showPuller?: boolean;
  /** 親のツールバーで戻る場合は非表示 */
  hideBackButton?: boolean;
  /** 地図上の検索パネル内＝Google マップの場所カード風に詰める */
  embedVariant?: "default" | "mapPlace";
};

function buildDirectionsUrl(building: Building): string {
  if (building.googleMapsUrl?.trim()) return building.googleMapsUrl.trim();
  const { lat, lng } = building.location;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function BuildingDetailPanel({
  building,
  onBack,
  onClose,
  showPuller = false,
  hideBackButton = false,
  embedVariant = "default",
}: BuildingDetailPanelProps) {
  const title = building.nameJa ?? building.name;
  const subtitle =
    building.nameJa && building.name !== building.nameJa ? building.name : null;
  const yearLabel = building.yearCompleted
    ? `${building.yearCompleted}年完成`
    : null;
  const locationLine = [building.country, building.city, building.ward]
    .filter(Boolean)
    .join(" · ");

  const summaryText = useMemo(() => {
    if (building.shortDescription?.trim())
      return building.shortDescription.trim();
    if (building.description?.trim()) return building.description.trim();
    return "";
  }, [building.shortDescription, building.description]);

  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    setFav(isFavoriteBuildingId(building.id));
  }, [building.id]);

  useEffect(() => {
    setSummaryExpanded(false);
  }, [building.id]);

  const summaryLong = summaryText.length > SUMMARY_COLLAPSE_CHARS;
  const summaryDisplay =
    summaryLong && !summaryExpanded
      ? `${summaryText.slice(0, SUMMARY_COLLAPSE_CHARS).trim()}…`
      : summaryText;

  const galleryUrls = useMemo(() => {
    const urls: string[] = [];
    const cover = getImageUrl(building.coverImageUrl);
    urls.push(cover);
    for (const u of building.gallery ?? []) {
      const resolved = getImageUrl(u);
      if (!urls.includes(resolved)) urls.push(resolved);
    }
    return urls.slice(0, 12);
  }, [building.coverImageUrl, building.gallery]);

  const handleDirections = useCallback(() => {
    window.open(buildDirectionsUrl(building), "_blank", "noopener,noreferrer");
  }, [building]);

  const handleShare = useCallback(async () => {
    const path = `/buildings/${building.slug || building.id}`;
    const url =
      typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
    try {
      if (navigator.share) {
        await navigator.share({
          title: title,
          text: `${title} — ArchiNotes`,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        /* ignore */
      }
    }
  }, [building.slug, building.id, title]);

  const handleFavorite = useCallback(() => {
    const next = toggleFavoriteBuildingId(building.id);
    setFav(next);
  }, [building.id]);

  const showBackRow = onBack && !hideBackButton;
  const isMapPlace = embedVariant === "mapPlace";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        ...(isMapPlace && { bgcolor: "background.paper" }),
      }}
    >
      {(showBackRow || onClose) && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 0.5,
            minHeight: 48,
            borderBottom: 1,
            borderColor: "divider",
            flexShrink: 0,
          }}
        >
          <Box>
            {showBackRow && (
              <IconButton aria-label="一覧に戻る" onClick={onBack} size="small">
                <ArrowBack />
              </IconButton>
            )}
          </Box>
          <Box>
            {onClose && (
              <IconButton aria-label="閉じる" onClick={onClose} size="small">
                <Close />
              </IconButton>
            )}
          </Box>
        </Stack>
      )}

      {showPuller && (
        <Box
          sx={{
            width: 40,
            height: 4,
            borderRadius: 999,
            bgcolor: "grey.300",
            mx: "auto",
            mt: 1,
            mb: 1,
            flexShrink: 0,
          }}
        />
      )}

      <Box
        sx={{
          position: "relative",
          aspectRatio: isMapPlace ? "16 / 10" : "16 / 9",
          width: "100%",
          bgcolor: "grey.200",
          flexShrink: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getImageUrl(building.coverImageUrl)}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          onError={(e) => {
            e.currentTarget.src = getImageUrl(null);
          }}
        />
      </Box>

      <Box
        sx={{
          px: isMapPlace ? 2.5 : 2,
          py: isMapPlace ? 2.5 : 2,
          flex: 1,
          minHeight: 0,
        }}
      >
        <Typography
          variant="h5"
          component="h2"
          fontWeight={400}
          sx={{
            mb: 0.5,
            ...(isMapPlace && { fontSize: "1.375rem", lineHeight: 1.3 }),
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, fontSize: isMapPlace ? "0.875rem" : undefined }}
          >
            {subtitle}
          </Typography>
        )}

        <Stack
          direction="row"
          flexWrap="wrap"
          justifyContent={isMapPlace ? "flex-start" : "space-between"}
          useFlexGap
          sx={{
            gap: isMapPlace ? 1.25 : 1,
            mb: 2,
            px: 0.5,
            rowGap: 1.5,
          }}
        >
          <MapAction
            icon={<Directions />}
            label="経路"
            primary
            onClick={handleDirections}
          />
          <MapAction
            icon={fav ? <Bookmark /> : <BookmarkBorder />}
            label="保存"
            onClick={handleFavorite}
          />
          {isMapPlace && (
            <MapAction
              icon={<Explore />}
              label="周辺"
              onClick={() => {
                const { lat, lng } = building.location;
                window.open(
                  `https://www.google.com/maps/@${lat},${lng},17z`,
                  "_blank",
                  "noopener,noreferrer",
                );
              }}
            />
          )}
          <MapAction icon={<Share />} label="共有" onClick={handleShare} />
          <MapAction
            icon={<OpenInNew />}
            label="詳細"
            href={`/buildings/${building.slug || building.id}`}
          />
        </Stack>

        {(yearLabel || locationLine || building.architectName) && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {[building.architectName, yearLabel, locationLine]
              .filter(Boolean)
              .join(" · ")}
          </Typography>
        )}

        {building.address && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            {building.address}
          </Typography>
        )}
        {building.nearestStation && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            最寄り: {building.nearestStation}
          </Typography>
        )}

        {summaryText ? (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="h6"
              component="h3"
              sx={{ mb: 1, fontSize: "1.1rem" }}
            >
              概要
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ whiteSpace: "pre-wrap" }}
            >
              {summaryDisplay}
            </Typography>
            {summaryLong && (
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => setSummaryExpanded((e) => !e)}
                sx={{ mt: 0.5, cursor: "pointer" }}
              >
                {summaryExpanded ? "閉じる" : "もっと見る"}
              </Link>
            )}
          </Box>
        ) : null}

        {galleryUrls.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{ mb: 1 }}
            >
              <PhotoLibrary fontSize="small" color="action" />
              <Typography
                variant="h6"
                component="h3"
                sx={{ fontSize: "1.1rem" }}
              >
                写真
              </Typography>
            </Stack>
            <Stack
              direction="row"
              spacing={1}
              sx={{
                overflowX: "auto",
                pb: 1,
                mx: -2,
                px: 2,
                scrollbarWidth: "thin",
              }}
            >
              {galleryUrls.map((src, i) => (
                <Box
                  key={`${src}-${i}`}
                  sx={{
                    flexShrink: 0,
                    width: 120,
                    height: 88,
                    borderRadius: 1,
                    overflow: "hidden",
                    bgcolor: "grey.200",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                    onError={(e) => {
                      e.currentTarget.src = getImageUrl(null);
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        <Button
          component={NextLink}
          href={`/buildings/${building.slug || building.id}`}
          variant="outlined"
          fullWidth
          size="medium"
          endIcon={<OpenInNew />}
        >
          建築の全情報を見る
        </Button>
      </Box>
    </Box>
  );
}

function MapAction({
  icon,
  label,
  onClick,
  primary,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  primary?: boolean;
  href?: string;
}) {
  const sx = {
    bgcolor: primary ? "primary.main" : "grey.100",
    color: primary ? "primary.contrastText" : "action.active",
    width: 56,
    height: 56,
    "&:hover": {
      bgcolor: primary ? "primary.dark" : "grey.200",
    },
  } as const;

  return (
    <Stack
      alignItems="center"
      spacing={0.5}
      sx={{ width: 72, flex: "0 0 auto" }}
    >
      {href ? (
        <IconButton component={NextLink} href={href} aria-label={label} sx={sx}>
          {icon}
        </IconButton>
      ) : (
        <IconButton type="button" onClick={onClick} aria-label={label} sx={sx}>
          {icon}
        </IconButton>
      )}
      <Typography
        variant="caption"
        color="text.secondary"
        align="center"
        sx={{ lineHeight: 1.2 }}
      >
        {label}
      </Typography>
    </Stack>
  );
}
