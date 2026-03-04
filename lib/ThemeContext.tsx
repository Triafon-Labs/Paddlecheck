"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { lightTheme, darkTheme } from "./themes";
import CssBaseline from "@mui/material/CssBaseline";
import { GlobalStyles } from "@mui/material";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within an AppThemeProvider");
  }
  return context;
};

export const AppThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("themeMode") as ThemeMode | null;
    if (savedTheme) {
      setThemeMode(savedTheme);
    }
  }, []);

  const activeTheme = useMemo(() => {
    return themeMode === "dark" ? darkTheme : lightTheme;
  }, [themeMode]);

  const contextValue = useMemo(
    () => ({
      themeMode,
      setThemeMode: (mode: ThemeMode) => {
        localStorage.setItem("themeMode", mode);
        setThemeMode(mode);
      },
    }),
    [themeMode]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={activeTheme}>
        <CssBaseline />
        <GlobalStyles
          styles={{
            body: { backgroundColor: activeTheme.palette.background.default },
          }}
        />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
