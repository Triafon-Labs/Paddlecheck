"use client";

import React from "react";
import { AppBar, Toolbar } from "@mui/material";
import Image from "next/image";

const TopNavBar = () => {
  return (
    <AppBar position="static" color="inherit" elevation={0}>
      <Toolbar sx={{ justifyContent: "center" }}>
        <Image
          src="/favicon.svg"
          alt="Paddlecheck Logo"
          width={32}
          height={32}
        />
      </Toolbar>
    </AppBar>
  );
};

export default TopNavBar;
