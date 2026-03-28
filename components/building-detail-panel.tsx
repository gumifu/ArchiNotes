"use client";

import { AiSourceInfo } from "@/components/ai-source-info";
import { AiSuggestionBadge } from "@/components/ai-suggestion-badge";
import { BuildingGooglePlaceInfo } from "@/components/building-google-place-info";
import { useBuildingCoverImageSrc } from "@/hooks/use-building-cover-image";
import { useUiLocale } from "@/hooks/use-ui-locale";
import { trackBuildingStat } from "@/lib/building-stats";
import { appUiStrings } from "@/lib/app-ui-strings";
import { pickLocalized } from "@/lib/locale-text";
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
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

const SUMMARY_COLLAPSE_CHARS = 280;

function GalleryImageWithFallback({ src: initialSrc }: { src: string }) {
  const [src, setSrc] = useState(initialSrc);
  return (
    <Image
      src={src}
      alt=""
      fill
      className="object-cover"
      sizes="120px"
      onError={() => setSrc(getImageUrl(null))}
    />
  );
}

export type BuildingDetailPanelProps = {
  building: Building;
  /** 一覧へ戻る（デスクトップサイドバー用） */
  onBack?: () => void;
  /** 閉じる（モバイル下部ドロワー用） */
  onClose?: () => void;
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
  hideBackButton = false,
  embedVariant = "default",
}: BuildingDetailPanelProps) {
  const {
    src: coverSrc,
    onError: onCoverError,
    placesPhotoUrls,
  } = useBuildingCoverImageSrc(building);
  const locale = useUiLocale();
  const ui = appUiStrings(locale);
  const title = pickLocalized(building.name, locale);
  const altLocale = locale === "ja" ? "en" : "ja";
  const subtitleRaw = pickLocalized(building.name, altLocale);
  const subtitle =
    subtitleRaw && subtitleRaw !== title ? subtitleRaw : null;
  const architectDisplay = pickLocalized(building.architectName, locale);
  const addressDisplay = pickLocalized(building.address, locale);
  const yearLabel =
    building.yearCompleted != null
      ? ui.yearCompleted(building.yearCompleted)
      : null;
  const locationLine = [building.country, building.city, building.ward]
    .filter(Boolean)
    .join(" · ");

  const summaryText = useMemo(
    () => pickLocalized(building.summary, locale).trim(),
    [building.summary, locale],
  );

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
    for (const u of building.gallery ?? []) {
      const resolved = getImageUrl(u);
      if (!urls.includes(resolved)) urls.push(resolved);
    }
    for (const u of placesPhotoUrls) {
      if (!urls.includes(u)) urls.push(u);
    }
    return urls.slice(0, 20);
  }, [building.gallery, placesPhotoUrls]);

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
    if (next) {
      trackBuildingStat(building.id, "save");
    }
  }, [building.id]);

  const showBackRow = onBack && !hideBackButton;
  const isMapPlace = embedVariant === "mapPlace";

  const hasToolbar = showBackRow || onClose;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "100%",
        minHeight: 0,
        overflow: "hidden",
        ...(isMapPlace && { bgcolor: "background.paper" }),
      }}
    >
      {hasToolbar && (
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
            bgcolor: "background.paper",
            zIndex: 1,
          }}
        >
          <Box>
            {showBackRow && (
              <IconButton aria-label={ui.backToListAria} onClick={onBack} size="small">
                <ArrowBack />
              </IconButton>
            )}
          </Box>
          <Box>
            {onClose && (
              <IconButton aria-label={ui.closeAria} onClick={onClose} size="small">
                <Close />
              </IconButton>
            )}
          </Box>
        </Stack>
      )}

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <Box
          sx={{
            position: "relative",
            height: isMapPlace ? 160 : 200,
            width: "100%",
            bgcolor: "grey.200",
            flexShrink: 0,
          }}
        >
          <Image
            src={coverSrc}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 420px"
            onError={onCoverError}
          />
        </Box>

      <Box
        sx={{
          px: isMapPlace ? 2.5 : 2,
          py: isMapPlace ? 2.5 : 2,
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
            label={ui.directions}
            primary
            onClick={handleDirections}
          />
          <MapAction
            icon={fav ? <Bookmark /> : <BookmarkBorder />}
            label={ui.save}
            onClick={handleFavorite}
          />
          {isMapPlace && (
            <MapAction
              icon={<Explore />}
              label={ui.nearby}
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
          <MapAction icon={<Share />} label={ui.share} onClick={handleShare} />
          <MapAction
            icon={<OpenInNew />}
            label={ui.details}
            href={`/buildings/${building.slug || building.id}`}
          />
        </Stack>

        {(yearLabel || locationLine || architectDisplay) && (
          <Typography
            variant="body2"
            color="text.secondary"
            component="div"
            sx={{
              mb: 2,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              columnGap: 0.75,
              rowGap: 0.5,
            }}
          >
            {architectDisplay ? (
              <Box
                component="span"
                sx={{
                  display: "inline-flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                {architectDisplay}
                {building.aiMeta?.architectName?.isAiSuggested === true && (
                  <>
                    <AiSuggestionBadge />
                    <AiSourceInfo
                      sourceName={building.aiMeta.architectName.sourceName}
                      sourceUrl={building.aiMeta.architectName.sourceUrl}
                      note={building.aiMeta.architectName.note}
                    />
                  </>
                )}
              </Box>
            ) : null}
            {architectDisplay && (yearLabel || locationLine) ? (
              <span aria-hidden>·</span>
            ) : null}
            {yearLabel ? (
              <Box
                component="span"
                sx={{
                  display: "inline-flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                {yearLabel}
                {building.aiMeta?.year?.isAiSuggested === true && (
                  <>
                    <AiSuggestionBadge />
                    <AiSourceInfo
                      sourceName={building.aiMeta.year.sourceName}
                      sourceUrl={building.aiMeta.year.sourceUrl}
                      note={building.aiMeta.year.note}
                    />
                  </>
                )}
              </Box>
            ) : null}
            {(architectDisplay || yearLabel) && locationLine ? (
              <span aria-hidden>·</span>
            ) : null}
            {locationLine || null}
          </Typography>
        )}

        {addressDisplay && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            {addressDisplay}
          </Typography>
        )}
        {building.nearestStation && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {ui.nearestStation(building.nearestStation)}
          </Typography>
        )}

        {building.googlePlaceId && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="h6"
              component="h3"
              sx={{ mb: 1, fontSize: "1.1rem" }}
            >
              Google Places
            </Typography>
            <BuildingGooglePlaceInfo building={building} />
          </Box>
        )}

        {summaryText ? (
          <Box sx={{ mb: 2 }}>
            {building.aiMeta?.summary?.isAiSuggested === true && (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 0.75,
                  mb: 1,
                }}
              >
                <AiSuggestionBadge />
                <AiSourceInfo
                  sourceName={building.aiMeta.summary.sourceName}
                  sourceUrl={building.aiMeta.summary.sourceUrl}
                  note={building.aiMeta.summary.note}
                />
              </Box>
            )}
            <Typography
              variant="h6"
              component="h3"
              sx={{ mb: 1, fontSize: "1.1rem" }}
            >
              {ui.summaryHeading}
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
                {summaryExpanded ? ui.showLess : ui.showMore}
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
                {ui.photosHeading}
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
                    position: "relative",
                    flexShrink: 0,
                    width: 120,
                    height: 88,
                    borderRadius: 1,
                    overflow: "hidden",
                    bgcolor: "grey.200",
                  }}
                >
                  <GalleryImageWithFallback src={src} />
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
          {ui.viewFullBuilding}
        </Button>
      </Box>
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
