"use client";

/**
 * MUI Skeleton（読み込みプレースホルダー）
 * @see https://mui.com/material-ui/react-skeleton/
 */
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";

/** 建築登録ページの Suspense 用（フォーム列幅に近い） */
export function NewBuildingFormSkeleton() {
  return (
    <div className="archinotes-max-w-form space-y-5">
      <Stack spacing={1.5}>
        <Skeleton variant="rounded" height={40} animation="wave" />
        <Skeleton variant="rounded" height={40} animation="wave" />
        <Skeleton variant="rounded" height={40} animation="wave" />
        <Skeleton variant="rounded" height={40} animation="wave" />
      </Stack>
      <Skeleton variant="rounded" height={220} animation="wave" sx={{ borderRadius: 1 }} />
      <Stack spacing={1}>
        <Skeleton
          variant="text"
          animation="wave"
          sx={{ fontSize: "0.875rem" }}
          width="60%"
        />
        <Skeleton variant="rounded" height={36} animation="wave" />
      </Stack>
    </div>
  );
}

/** Google Places 詳細ブロック取得中 */
export function GooglePlacesDetailSkeleton() {
  return (
    <Stack spacing={2} sx={{ py: 0.5 }}>
      <Skeleton variant="rounded" height={48} animation="wave" />
      <Box>
        <Skeleton variant="text" animation="wave" width="35%" sx={{ mb: 1 }} />
        <Skeleton variant="text" animation="wave" width="90%" />
        <Skeleton variant="text" animation="wave" width="75%" />
      </Box>
      <Box>
        <Skeleton variant="text" animation="wave" width="30%" sx={{ mb: 1 }} />
        <Skeleton variant="text" animation="wave" width="50%" />
      </Box>
      <Skeleton variant="rounded" height={96} animation="wave" />
    </Stack>
  );
}

/** 検索パネル内: Google 候補取得中 */
export function GoogleSuggestionsListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Stack spacing={0} sx={{ px: 2, py: 1, pb: 2 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Stack
          key={i}
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{ py: 1.25 }}
        >
          <Skeleton variant="circular" width={22} height={22} animation="wave" />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Skeleton
              variant="text"
              animation="wave"
              sx={{ mb: 0.5, width: `${Math.max(45, 88 - i * 10)}%` }}
            />
            <Skeleton
              variant="text"
              animation="wave"
              sx={{ width: `${Math.max(35, 62 - i * 8)}%` }}
            />
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}

/** 地図下部カルーセル相当の横並びプレースホルダー */
export function MapBottomCarouselSkeleton() {
  const theme = useTheme();
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
          "linear-gradient(to top, rgba(0,0,0,0.08) 0%, transparent 100%)",
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          px: 2,
          pl: 2.5,
          pb: 1,
          overflow: "hidden",
        }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <Paper
            key={i}
            variant="outlined"
            sx={{
              flex: "0 0 auto",
              width: "min(85vw, 360px)",
              minWidth: 200,
              height: 120,
              p: 1,
              display: "flex",
              gap: 1,
              borderRadius: 2,
            }}
          >
            <Skeleton variant="rounded" width={112} height={120} animation="wave" />
            <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0, justifyContent: "center" }}>
              <Skeleton variant="text" sx={{ width: "90%" }} animation="wave" />
              <Skeleton variant="text" sx={{ width: "55%" }} animation="wave" />
              <Skeleton variant="text" sx={{ width: "40%" }} animation="wave" />
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}
