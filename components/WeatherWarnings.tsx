import React from "react";
import { Alert, AlertTitle, Stack, Typography, Link, Box } from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import { WeatherWarning, WarningSeverity } from "@/types";

interface Props {
  warnings?: WeatherWarning[];
}

const severityToColor: Record<WarningSeverity, "warning" | "error" | "info"> = {
  Yellow: "warning",
  Amber: "warning",
  Red: "error",
};

const WeatherWarnings: React.FC<Props> = ({ warnings }) => {
  if (!warnings || warnings.length === 0) return null;

  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      {warnings.map((warning, index) => {
        const severity = severityToColor[warning.severity];
        return (
          <Alert
            key={index}
            severity={severity}
            icon={<WarningIcon />}
            sx={{
              borderRadius: 2,
              backgroundColor: warning.severity === "Red" ? "#d32f2f" : undefined,
              color: warning.severity === "Red" ? "#fff" : undefined,
              "& .MuiAlert-icon": {
                color: warning.severity === "Red" ? "#fff" : undefined,
              },
              "& .MuiAlert-message": {
                width: "100%",
              }
            }}
          >
            <AlertTitle sx={{ fontWeight: "bold" }}>
              {warning.headline}
            </AlertTitle>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {warning.description}
            </Typography>
            <Box sx={{ textAlign: "right" }}>
              <Link
                href={warning.link}
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
                sx={{
                  typography: "caption",
                  textDecoration: "underline",
                  fontWeight: "bold"
                }}
              >
                UK Met Office
              </Link>
            </Box>
          </Alert>
        );
      })}
    </Stack>
  );
};

export default WeatherWarnings;
