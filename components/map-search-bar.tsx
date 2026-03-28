"use client";

import type { ChangeEvent, KeyboardEvent } from "react";

import Clear from "@mui/icons-material/Clear";
import Directions from "@mui/icons-material/Directions";
import Search from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Paper from "@mui/material/Paper";
import { alpha } from "@mui/material/styles";

const BAR_SHADOW =
  "0 1px 2px rgba(60,64,67,0.3), 0 2px 6px 2px rgba(60,64,67,0.15)";

export type MapSearchBarProps = {
  value: string;
  placeholder?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  showClear?: boolean;
  onDirections?: () => void;
  hideDirections?: boolean;
  /**
   * `cardTop`: 下にパネルが続くとき。上だけ角丸・下は区切り線のみ（一枚のカードのヘッダー）。
   */
  variant?: "standalone" | "cardTop";
};

/**
 * Google マップ Web 風: 入力・右端に検索アイコン・青い経路ボタン。
 */
export function MapSearchBar({
  value,
  placeholder = "ArchiNotes を検索",
  readOnly = false,
  onChange,
  onFocus,
  onKeyDown,
  onClear,
  showClear = false,
  onDirections,
  hideDirections = false,
  variant = "standalone",
}: MapSearchBarProps) {
  const isCardTop = variant === "cardTop";

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: isCardTop ? 0 : 3,
        boxShadow: isCardTop ? "none" : BAR_SHADOW,
        bgcolor: "background.paper",
        display: "flex",
        alignItems: "center",
        pl: 2,
        pr: 0.75,
        py: 0.5,
        minHeight: 48,
        border: isCardTop ? "none" : 1,
        borderColor: isCardTop
          ? undefined
          : (t) => alpha(t.palette.divider, 0.9),
        borderBottom: isCardTop ? 1 : undefined,
        borderBottomColor: isCardTop ? "divider" : undefined,
      }}
    >
      <InputBase
        fullWidth
        placeholder={placeholder}
        value={value}
        readOnly={readOnly}
        onChange={
          onChange
            ? (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)
            : undefined
        }
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        sx={{
          flex: 1,
          fontSize: "1rem",
          "& .MuiInputBase-input": {
            py: 1.25,
            "&::placeholder": {
              color: "text.secondary",
              opacity: 1,
            },
          },
        }}
      />
      <Box
        sx={{ display: "flex", alignItems: "center", flexShrink: 0, gap: 0.25 }}
      >
        {showClear && onClear && (
          <IconButton
            size="small"
            aria-label="クリア"
            onClick={onClear}
            sx={{ color: "text.secondary" }}
          >
            <Clear fontSize="small" />
          </IconButton>
        )}
        <Search
          sx={{ color: "text.secondary", fontSize: 22, mr: 0.5 }}
          aria-hidden
        />
        {!hideDirections && onDirections && (
          <IconButton
            onClick={onDirections}
            aria-label="Google マップで経路を開く"
            size="small"
            sx={{
              ml: 0.25,
              width: 40,
              height: 40,
              borderRadius: 1,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            <Directions sx={{ fontSize: 22 }} />
          </IconButton>
        )}
      </Box>
    </Paper>
  );
}
