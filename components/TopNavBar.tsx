"use client";

import React from "react";
import { AppBar, Toolbar, Box } from "@mui/material";
import Image from "next/image";

const TopNavBar = () => {
  return (
    <AppBar position="static" color="primary" elevation={0}>
      <Toolbar sx={{ justifyContent: "center" }}>
        <Image
          src="/icons/favicon.svg"
          alt="Paddlecheck Logo"
          width={32}
          height={32}
        />
      </Toolbar>
    </AppBar>
  );
};

export default TopNavBar;
