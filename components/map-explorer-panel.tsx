"use client";

import { getImageUrl } from "@/lib/constants";
import type { Building } from "@/types/building";
import Search from "@mui/icons-material/Search";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import List from "@mui/material/List";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";

/**
 * モバイル左ドロワー用: 検索 + 建築一覧（シンプルな一覧 UI）。
 * デスクトップの検索体験は MapSearchUiArea を使用。
 */
export type MapExplorerPanelProps = {
  buildings: Building[];
  selectedBuilding: Building | null;
  onSelectBuilding: (building: Building) => void;
};

function normalize(s: string) {
  return s.trim().toLowerCase();
}

export function MapExplorerPanel({
  buildings,
  selectedBuilding,
  onSelectBuilding,
}: MapExplorerPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(searchQuery);
    if (!q) return buildings;
    return buildings.filter((b) => {
      const hay = [b.name, b.nameJa, b.architectName, b.city, b.country, b.ward]
        .filter(Boolean)
        .join(" ");
      return normalize(hay).includes(q);
    });
  }, [buildings, searchQuery]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "background.paper",
      }}
    >
      <Toolbar
        variant="dense"
        sx={{
          gap: 1,
          px: 2,
          minHeight: 56,
          borderBottom: 1,
          borderColor: "divider",
          alignItems: "flex-start",
          py: 1.5,
        }}
      >
        <TextField
          size="small"
          fullWidth
          placeholder="建築を検索"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Toolbar>

      <Box sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        {filtered.length === 0 ? (
          <Box sx={{ px: 2, py: 4 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              該当する建築がありません
            </Typography>
          </Box>
        ) : (
          <List disablePadding dense>
            {filtered.map((b) => (
              <ListItemButton
                key={b.id}
                alignItems="flex-start"
                selected={selectedBuilding?.id === b.id}
                onClick={() => onSelectBuilding(b)}
                sx={{ py: 1.5, px: 2 }}
              >
                <ListItemAvatar sx={{ minWidth: 56 }}>
                  <Avatar
                    variant="rounded"
                    sx={{ width: 48, height: 48 }}
                    src={getImageUrl(b.coverImageUrl)}
                    alt=""
                    imgProps={{
                      onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
                        e.currentTarget.src = getImageUrl(null);
                      },
                    }}
                  />
                </ListItemAvatar>
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
        )}
      </Box>
    </Box>
  );
}
