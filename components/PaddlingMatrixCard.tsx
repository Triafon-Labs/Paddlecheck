import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Box,
  Collapse,
  IconButton,
} from "@mui/material";
import {
  CheckCircleOutline,
  CancelOutlined,
  WarningAmberOutlined,
  HelpOutline,
  KeyboardArrowDown,
  KeyboardArrowUp,
} from "@mui/icons-material";
import {
  Status,
  PaddlerType,
  PaddlingMatrix,
  PaddlingStatus,
  PaddlingStatusValue,
} from "@/types";
import { ragStatus } from "@/lib/rag";

interface PaddlingMatrixCardProps {
  overallStatus: Status;
  riverLevel?: number;
}

const getStatusIcon = (status: PaddlingStatusValue) => {
  switch (status) {
    case "Yes":
      return (
        <CheckCircleOutline style={{ color: ragStatus["Light Green"].color }} />
      );
    case "No":
      return <CancelOutlined style={{ color: ragStatus["Red"].color }} />;
    case "Discretion":
      return (
        <WarningAmberOutlined style={{ color: ragStatus["Amber"].color }} />
      );
    case "Warning":
      return (
        <WarningAmberOutlined style={{ color: ragStatus["Amber"].color }} />
      );
    default:
      return <HelpOutline style={{ color: ragStatus["Unknown"].color }} />;
  }
};

const getPaddlingMatrix = (
  overallStatus: Status,
  riverLevel?: number
): PaddlingMatrix => {
  const matrix: PaddlingMatrix = {};

  const beginner: PaddlingStatus = { status: "No", details: "" };
  const junior: PaddlingStatus = { status: "No", details: "" };
  const improver: PaddlingStatus = { status: "No", details: "" };
  const intermediate: PaddlingStatus = { status: "No", details: "" };
  const independent: PaddlingStatus = { status: "No", details: "" };

  switch (overallStatus) {
    case "Light Green":
      beginner.status = "No";
      beginner.details = "Can only paddle in Dark Green conditions.";
      junior.status = "No";
      junior.details = "Can only paddle in Dark Green conditions.";
      improver.status = "Yes";
      improver.details =
        "Can paddle in a group without a coach under Annex rules. Must wear a PFD.";
      intermediate.status = "Yes";
      intermediate.details =
        "Can paddle solo under Annex rules (phone, approved boat, stay in defined area). Must wear a PFD.";
      independent.status = "Yes";
      independent.details = "No restrictions.";
      break;
    case "Dark Green": // User said Green = Dark Green
      beginner.status = "Yes";
      beginner.details = "Must be supervised by a club coach and wear a PFD.";
      junior.status = "Yes";
      junior.details =
        "Must be supervised by a club coach or independent paddler and wear a PFD.";
      improver.status = "Yes";
      improver.details = "Must be supervised by a club coach and wear a PFD.";
      intermediate.status = "Yes";
      intermediate.details =
        "Can paddle with at least one other intermediate paddler under Annex rules (phone, approved boat, stay in defined area). Must wear a PFD.";
      independent.status = "Yes";
      independent.details = "No restrictions.";
      break;
    case "Amber":
      beginner.status = "Discretion";
      beginner.details = "At the discretion of their coach. Must wear a PFD.";
      junior.status = "Discretion";
      junior.details = "At the discretion of their coach. Must wear a PFD.";
      improver.status = "Discretion";
      improver.details = "At the discretion of their coach. Must wear a PFD.";
      intermediate.status = "Yes";
      intermediate.details =
        "Can be supervised by an Independent paddler or club coach. Must wear a PFD.";
      independent.status = "Yes";
      independent.details = "May supervise Intermediate paddlers.";
      break;
    case "Red":
      beginner.status = "No";
      beginner.details = "No paddling in RED conditions.";
      junior.status = "No";
      junior.details = "No paddling in RED conditions.";
      improver.status = "No";
      improver.details = "No paddling in RED conditions.";
      if (riverLevel && riverLevel >= 2.75) {
        intermediate.status = "No";
        intermediate.details =
          "No paddling when river is on or above 10th step from car park.";
      } else {
        intermediate.status = "Discretion";
        intermediate.details =
          "At the discretion of their coach. Must wear a PFD.";
      }
      independent.status = "Warning";
      independent.details =
        "Strongly advised not to paddle alone. Must wear PFD.";
      break;
    case "No Paddling":
    case "Unknown":
    default:
      beginner.details = "Paddling not recommended.";
      junior.details = "Paddling not recommended.";
      improver.details = "Paddling not recommended.";
      intermediate.details = "Paddling not recommended.";
      independent.details = "Paddling not recommended.";
      break;
  }

  // Independent PFD warning for high water level, if not in Red conditions (as Red already includes it)
  if (overallStatus !== 'Red' && riverLevel && riverLevel >= 1.48) {
    if (independent.status === "Yes") {
      independent.status = "Warning";
      independent.details = "Must wear PFD as river is on or above concrete landing stage.";
    } else if (independent.status !== "No") {
      independent.details += " Must wear PFD as river is on or above concrete landing stage.";
    }
  }

  matrix["Beginner"] = beginner;
  matrix["Junior"] = junior;
  matrix["Improver"] = improver;
  matrix["Intermediate"] = intermediate;
  matrix["Independent"] = independent;

  return matrix;
};

const PaddlingMatrixCard: React.FC<PaddlingMatrixCardProps> = ({
  overallStatus,
  riverLevel,
}) => {
  const paddlingMatrix = getPaddlingMatrix(overallStatus, riverLevel);

  const paddlerTypes: PaddlerType[] = [
    "Junior",
    "Beginner",
    "Improver",
    "Intermediate",
    "Independent",
  ];

  const [open, setOpen] = useState<Record<PaddlerType, boolean>>({});

  useEffect(() => {
    const savedLevel = localStorage.getItem("paddlerLevel") as PaddlerType | null;

    const newOpenState = paddlerTypes.reduce((acc, paddler) => {
      if (savedLevel) {
        acc[paddler] = paddler === savedLevel;
      } else {
        acc[paddler] = true; // Expand all if no level is selected
      }
      return acc;
    }, {} as Record<PaddlerType, boolean>);

    setOpen(newOpenState);

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "paddlerLevel") {
        const newLevel = event.newValue as PaddlerType | null;
        const updatedOpenState = paddlerTypes.reduce((acc, paddler) => {
          if (newLevel) {
            acc[paddler] = paddler === newLevel;
          } else {
            acc[paddler] = true;
          }
          return acc;
        }, {} as Record<PaddlerType, boolean>);
        setOpen(updatedOpenState);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []); // Empty dependency array to run only on mount and unmount

  const handleToggle = (paddler: PaddlerType) => {
    setOpen((prevOpen) => ({ ...prevOpen, [paddler]: !prevOpen[paddler] }));
  };

  return (
    <Card variant="outlined" sx={{ width: "100%", p: 2 }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Who Can Paddle
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell /> {/* For the collapse button */}
                <TableCell>Paddler</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paddlerTypes.map((paddler) => {
                const statusInfo = paddlingMatrix[paddler];
                return (
                  <React.Fragment key={paddler}>
                    <TableRow>
                      <TableCell>
                        <IconButton
                          aria-label="expand row"
                          size="small"
                          onClick={() => handleToggle(paddler)}
                        >
                          {open[paddler] ? (
                            <KeyboardArrowUp />
                          ) : (
                            <KeyboardArrowDown />
                          )}
                        </IconButton>
                      </TableCell>
                      <TableCell component="th" scope="row">
                        {paddler}
                      </TableCell>
                      <TableCell align="center">
                        {statusInfo && (
                          <Tooltip title={statusInfo.status} placement="top">
                            <Box display="flex" justifyContent="center">
                              {getStatusIcon(statusInfo.status)}
                            </Box>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        style={{ paddingBottom: 0, paddingTop: 0 }}
                        colSpan={3}
                      >
                        <Collapse
                          in={open[paddler]}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box sx={{ margin: 1 }}>
                            <Typography variant="body2">
                              {statusInfo ? statusInfo.details : ""}
                            </Typography>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default PaddlingMatrixCard;
