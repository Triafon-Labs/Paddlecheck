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
  CheckCircleOutlined,
  CancelOutlined,
  WarningAmberOutlined,
  HelpOutlined,
  ExpandMore,
} from "@mui/icons-material";
import {
  Status,
  PaddlerType,
  PaddlingMatrix,
  PaddlingStatus,
  PaddlingStatusValue,
} from "@/types";
import { ragStatus } from "@/lib/rag";
import { THRESHOLDS } from "@/lib/config";

export const PADDLER_LEVEL_CHANGED_EVENT = "paddlecheck:paddler-level-changed";

interface PaddlingMatrixCardProps {
  overallStatus?: Status;
  riverLevel?: number;
  loading?: boolean;
}

const getStatusIcon = (status: PaddlingStatusValue) => {
  switch (status) {
    case "Yes":
      return (
        <CheckCircleOutlined
          style={{ color: ragStatus["Light Green"].color }}
        />
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
      return <HelpOutlined style={{ color: ragStatus["Unknown"].color }} />;
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
        "Can paddle as a group without a coach, provided the group has a mobile phone, uses a familiar boat, and stays upstream of Sabrina Bridge and downstream of the Slip. PFD required.";
      intermediate.status = "Yes";
      intermediate.details =
        "Can paddle solo. Carry a mobile phone, use a familiar boat, and stay upstream of Sabrina Bridge and downstream of the Slip. PFD required.";
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
        "Can paddle with at least one other intermediate without a coach. Carry a mobile phone, use a familiar boat, and stay upstream of Sabrina Bridge and downstream of the Slip. PFD required.";
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
      if (riverLevel && riverLevel >= THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_3) {
        intermediate.status = "No";
        intermediate.details =
          "No paddling – river is above 10 steps from the car park.";
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
  if (
    overallStatus !== "Red" &&
    riverLevel &&
    riverLevel >= THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_2
  ) {
    if (independent.status !== "No") {
      if (independent.status === "Yes") independent.status = "Warning";
      independent.details += " PFD required. River is high.";
    }

    if (intermediate.status !== "No") {
      if (intermediate.status === "Yes") intermediate.status = "Warning";
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
    const openStateForLevel = (level: PaddlerType | null) =>
      paddlerTypes.reduce(
        (acc, paddler) => {
          acc[paddler] = level ? paddler === level : true; // Expand all if no level is selected
          return acc;
        },
        {} as Record<PaddlerType, boolean>
      );

    const savedLevel = localStorage.getItem(
      "paddlerLevel"
    ) as PaddlerType | null;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(openStateForLevel(savedLevel));

    // Custom event fires in this same tab (the "storage" event only fires in
    // *other* tabs per spec), so the matrix updates immediately when the
    // level is changed in Settings without needing a reload.
    const handleLevelChanged = () => {
      const newLevel = localStorage.getItem("paddlerLevel") as PaddlerType | null;
      setOpen(openStateForLevel(newLevel));
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "paddlerLevel") {
        setOpen(openStateForLevel(event.newValue as PaddlerType | null));
      }
    };

    window.addEventListener(PADDLER_LEVEL_CHANGED_EVENT, handleLevelChanged);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(PADDLER_LEVEL_CHANGED_EVENT, handleLevelChanged);
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
                      <TableRow sx={{ "& .MuiTableCell-root": { borderBottom: "none" } }}>
                        <TableCell>
                          <IconButton
                            aria-label="expand row"
                            size="small"
                            onClick={() => handleToggle(paddler)}
                          >
                            <ExpandMore
                              sx={{
                                transform: open[paddler] ? "rotate(180deg)" : "rotate(0deg)",
                                transition: "transform 200ms cubic-bezier(0.2, 0, 0, 1)",
                              }}
                            />
                          </IconButton>
                        </TableCell>
                        <TableCell component="th" scope="row" align="center">
                          {paddler}
                        </TableCell>
                        <TableCell align="center">
                          {statusInfo && (
                            <Tooltip title={statusInfo.status} placement="top">
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "center",
                                }}
                              >
                                {getStatusIcon(statusInfo.status)}
                              </Box>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow sx={{ "& .MuiTableCell-root": { borderBottom: "none" } }}>
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
