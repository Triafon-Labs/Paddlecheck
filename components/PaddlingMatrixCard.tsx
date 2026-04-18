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
  CircularProgress,
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
  overallStatus?: Status;
  riverLevel?: number;
  loading?: boolean;
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
  const improver: PaddlingStatus = { status: "No", details: "" };
  const intermediate: PaddlingStatus = { status: "No", details: "" };
  const independent: PaddlingStatus = { status: "No", details: "" };

  switch (overallStatus) {
    case "Light Green":
      beginner.status = "Yes";
      beginner.details = "Must be supervised by a club coach. PFD required.";
      improver.status = "Yes";
      improver.details =
        "Can paddle as a group without a coach, provided the group includes someone who can swim with ease, has a mobile phone, uses a familiar boat, and stays upstream of Sabrina Bridge. PFD required.";
      intermediate.status = "Yes";
      intermediate.details =
        "Can paddle solo. Carry a mobile phone, use a familiar boat, and stay upstream of Sabrina Bridge. PFD required.";
      independent.status = "Yes";
      independent.details = "No restrictions.";
      break;
    case "Dark Green":
      beginner.status = "Yes";
      beginner.details = "Must be supervised by a club coach. PFD required.";
      improver.status = "Yes";
      improver.details = "Must be supervised by a club coach. PFD required.";
      intermediate.status = "Yes";
      intermediate.details =
        "Can paddle with at least one other intermediate without a coach. Carry a mobile phone, use a familiar boat, and stay upstream of Sabrina Bridge. PFD required.";
      independent.status = "Yes";
      independent.details = "No restrictions.";
      break;
    case "Amber":
      beginner.status = "Discretion";
      beginner.details = "Coach's discretion only. PFD required.";
      improver.status = "Discretion";
      improver.details = "Coach's discretion only. PFD required.";
      intermediate.status = "Yes";
      intermediate.details =
        "Must be supervised by an independent paddler or club coach. PFD required.";
      independent.status = "Yes";
      independent.details =
        "Can paddle. May supervise intermediate paddlers. PFD required if river is above the concrete step.";
      break;
    case "Red":
      beginner.status = "No";
      beginner.details = "No paddling in red conditions.";
      improver.status = "No";
      improver.details = "No paddling in red conditions.";
      if (riverLevel && riverLevel >= 2.75) {
        intermediate.status = "No";
        intermediate.details =
          "No paddling — river is above 10 steps from the car park.";
      } else {
        intermediate.status = "Discretion";
        intermediate.details = "Coach's discretion only. PFD required.";
      }
      independent.status = "Warning";
      independent.details = "Strongly advised not to paddle alone. PFD required.";
      break;
    case "No Paddling":
    case "Unknown":
    default:
      beginner.details = "Paddling not recommended.";
      improver.details = "Paddling not recommended.";
      intermediate.details = "Paddling not recommended.";
      independent.details = "Paddling not recommended.";
      break;
  }

  // PFD warning for high water level, if not in Red conditions (as Red already includes it)
  if (overallStatus !== "Red" && riverLevel && riverLevel >= 1.48) {
    if (independent.status === "Yes") {
      independent.status = "Warning";
      independent.details = "PFD required. River is high.";
    } else if (independent.status !== "No") {
      independent.details += " PFD required. River is high.";
    }

    if (intermediate.status === "Yes") {
      intermediate.status = "Warning";
      intermediate.details = "PFD required. River is high.";
    } else if (intermediate.status !== "No") {
      intermediate.details += " PFD required. River is high.";
    }
  }

  matrix["Beginner"] = beginner;
  matrix["Improver"] = improver;
  matrix["Intermediate"] = intermediate;
  matrix["Independent"] = independent;

  return matrix;
};

const paddlerTypes: PaddlerType[] = [
  "Beginner",
  "Improver",
  "Intermediate",
  "Independent",
];

const PaddlingMatrixCard: React.FC<PaddlingMatrixCardProps> = ({
  overallStatus,
  riverLevel,
  loading,
}) => {
  const paddlingMatrix =
    !loading && overallStatus
      ? getPaddlingMatrix(overallStatus, riverLevel)
      : {};

  const [open, setOpen] = useState<Record<PaddlerType, boolean>>(
    paddlerTypes.reduce(
      (acc, paddler) => ({ ...acc, [paddler]: false }),
      {} as Record<PaddlerType, boolean>
    )
  );

  useEffect(() => {
    const savedLevel = localStorage.getItem(
      "paddlerLevel"
    ) as PaddlerType | null;

    const newOpenState = paddlerTypes.reduce(
      (acc, paddler) => {
        if (savedLevel) {
          acc[paddler] = paddler === savedLevel;
        } else {
          acc[paddler] = true; // Expand all if no level is selected
        }
        return acc;
      },
      {} as Record<PaddlerType, boolean>
    );

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(newOpenState);

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "paddlerLevel") {
        const newLevel = event.newValue as PaddlerType | null;
        const updatedOpenState = paddlerTypes.reduce(
          (acc, paddler) => {
            if (newLevel) {
              acc[paddler] = paddler === newLevel;
            } else {
              acc[paddler] = true;
            }
            return acc;
          },
          {} as Record<PaddlerType, boolean>
        );
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
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell />
                  {/* For the collapse button */}
                  <TableCell align="center">Paddler</TableCell>
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
                        <TableCell component="th" scope="row" align="center">
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
        )}
      </CardContent>
    </Card>
  );
};

export default PaddlingMatrixCard;
