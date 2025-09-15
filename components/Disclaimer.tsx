import React from "react";
import { Typography, Paper } from "@mui/material";

const Disclaimer = () => {
  return (
    <Paper
      elevation={0}
      sx={{
        padding: 2,
        textAlign: "center",
        backgroundColor: "transparent",
      }}
    >
      <Typography variant="caption" color="text.secondary">
        This information is for guidance only. Please use your own judgment and
        consult with experienced individuals before making any decisions.
        Conditions can change rapidly.
      </Typography>
    </Paper>
  );
};

export default Disclaimer;
