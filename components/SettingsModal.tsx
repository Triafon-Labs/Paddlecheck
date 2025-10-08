"use client";

import React from "react";
import {
  Dialog,
  AppBar,
  Toolbar,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Button,
  SelectChangeEvent,
  DialogContent,
  Box,
  Divider,
} from "@mui/material";
import MaterialSwitch from "./MaterialSwitch";
import Slide from "@mui/material/Slide";
import { TransitionProps } from "@mui/material/transitions";
import { useAppTheme } from "@/lib/ThemeContext";
import { useEffect, useState } from "react";
import { PaddlerType } from "@/types";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const { themeMode, setThemeMode } = useAppTheme();
  const [paddlerLevel, setPaddlerLevel] = useState<PaddlerType | "">("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLevel = localStorage.getItem("paddlerLevel") as
        | PaddlerType
        | undefined;
      if (savedLevel) {
        setPaddlerLevel(savedLevel);
      }
    }
  }, []);

  const handleLevelChange = (event: SelectChangeEvent<PaddlerType | "">) => {
    const level = event.target.value as PaddlerType | "";
    setPaddlerLevel(level);
    if (level) {
      localStorage.setItem("paddlerLevel", level);
    } else {
      localStorage.removeItem("paddlerLevel");
    }
  };

  const handleClearLevel = () => {
    setPaddlerLevel("");
    localStorage.removeItem("paddlerLevel");
  };

  const paddlerTypes: PaddlerType[] = [
    "Junior",
    "Beginner",
    "Improver",
    "Intermediate",
    "Independent",
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 1,
          bgcolor: "background.paper",
        },
      }}
    >
      <AppBar sx={{ position: "relative" }} elevation={0} color="inherit">
        <Toolbar>
          <Typography sx={{ flex: 1 }} variant="h6" component="div">
            Settings
          </Typography>
        </Toolbar>
      </AppBar>
      <DialogContent sx={{ bgcolor: "background.paper" }}>
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Theme
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography>
            {themeMode === "dark" ? "Dark Mode" : "Light Mode"}
          </Typography>
          <MaterialSwitch
            checked={themeMode === "dark"}
            onChange={(e) =>
              setThemeMode(e.target.checked ? "dark" : "light")
            }
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          My Paddling Level
        </Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <Select
            id="paddler-level-select"
            value={paddlerLevel}
            onChange={handleLevelChange}
            displayEmpty
            inputProps={{ "aria-label": "Paddling Level" }}
          >
            {paddlerTypes.map((level) => (
              <MenuItem key={level} value={level}>
                {level}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          onClick={handleClearLevel}
          disabled={!paddlerLevel}
          fullWidth
        >
          Clear Selection
        </Button>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          About
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography>Paddlecheck Version</Typography>
          <Typography>
            {process.env.NEXT_PUBLIC_APP_VERSION || "N/A"}
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
