"use client";

import React, { useState } from "react";
import { Paper, BottomNavigation, BottomNavigationAction } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsIcon from "@mui/icons-material/Settings";
import LinkIcon from "@mui/icons-material/Link";
import SettingsModal from "./SettingsModal";
import LinksPopover from "./LinksPopover";
import { useKayakContext } from "@/lib/KayakDataContext";

const BottomNavBar = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [linksAnchorEl, setLinksAnchorEl] = useState<null | HTMLElement>(null);
  const { refetch } = useKayakContext();

  const handleLinksClick = (event: React.MouseEvent<HTMLElement>) => {
    setLinksAnchorEl(event.currentTarget);
  };

  const handleLinksClose = () => {
    setLinksAnchorEl(null);
  };

  const linksOpen = Boolean(linksAnchorEl);

  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  return (
    <>
      <Paper
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: "background.paper",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        elevation={0}
      >
        <BottomNavigation showLabels>
          <BottomNavigationAction
            label="Refresh"
            icon={<RefreshIcon />}
            onClick={() => refetch()}
          />
          <BottomNavigationAction
            label="Settings"
            icon={<SettingsIcon />}
            onClick={() => setSettingsOpen(true)}
          />
          <BottomNavigationAction
            label="Links"
            icon={<LinkIcon />}
            onClick={handleLinksClick}
          />
        </BottomNavigation>
      </Paper>
      <SettingsModal open={settingsOpen} onClose={handleSettingsClose} />
      <LinksPopover
        open={linksOpen}
        anchorEl={linksAnchorEl}
        onClose={handleLinksClose}
      />
    </>
  );
};

export default BottomNavBar;
