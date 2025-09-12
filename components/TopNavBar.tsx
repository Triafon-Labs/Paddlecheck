'use client';

import React from 'react';
import { AppBar, Toolbar, Box } from '@mui/material';
import KayakingIcon from '@mui/icons-material/Kayaking';

const TopNavBar = () => {
  return (
    <AppBar position="static" color="primary" elevation={0}>
      <Toolbar sx={{ justifyContent: 'center' }}>
        <KayakingIcon sx={{ fontSize: 32 }} />
      </Toolbar>
    </AppBar>
  );
};

export default TopNavBar;
