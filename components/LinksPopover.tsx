"use client";

import React from "react";
import { Popover, List, ListItem, Link, Typography, Box } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

interface LinksPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

const links = [
  {
    name: "River Severn level at Worcester (Barbourne)",
    url: "https://check-for-flooding.service.gov.uk/station/2092",
  },
  {
    name: "River Severn level at Bewdley",
    url: "https://check-for-flooding.service.gov.uk/station/2001",
  },
  {
    name: "Worcester Canoe Club",
    url: "https://worcestercanoeclub.org/",
  },
];

const LinksPopover: React.FC<LinksPopoverProps> = ({
  open,
  anchorEl,
  onClose,
}) => {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "top",
        horizontal: "center",
      }}
      transformOrigin={{
        vertical: "bottom",
        horizontal: "center",
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Useful Links
        </Typography>
        <List>
          {links.map((link) => (
            <ListItem
              key={link.name}
              component={Link}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                pl: 0,
                color: (theme) =>
                  theme.palette.mode === "dark"
                    ? "common.white"
                    : "primary.main",
              }}
            >
              <Typography sx={{ flexGrow: 1 }}>{link.name}</Typography>
              <OpenInNewIcon fontSize="small" />
            </ListItem>
          ))}
        </List>
      </Box>
    </Popover>
  );
};

export default LinksPopover;
