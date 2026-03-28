"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1a73e8" },
    secondary: { main: "#5f6368" },
    background: { default: "#f8f9fa", paper: "#ffffff" },
  },
  typography: {
    fontFamily:
      '"Google Sans", "Roboto", "Helvetica", "Arial", "Noto Sans JP", sans-serif',
  },
  shape: { borderRadius: 8 },
});

export function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
