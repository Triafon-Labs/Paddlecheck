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

  const beginner: PaddlingStatus = { status: "No", details: [] };
  const improver: PaddlingStatus = { status: "No", details: [] };
  const intermediate: PaddlingStatus = { status: "No", details: [] };
  const independent: PaddlingStatus = { status: "No", details: [] };

  const sabrinaSlip = "Stay between Sabrina Bridge and the Slip.";

  switch (overallStatus) {
    case "Light Green":
      beginner.status = "Yes";
      beginner.details = ["Coach supervision required.", "PFD required."];
      improver.status = "Yes";
      improver.details = [
        "Group can paddle without a coach.",
        "Group carries a mobile phone.",
        "Familiar boat only.",
        sabrinaSlip,
        "PFD required.",
      ];
      intermediate.status = "Yes";
      intermediate.details = [
        "Can paddle solo.",
        "Carry a mobile phone.",
        "Familiar boat only.",
        sabrinaSlip,
        "PFD required.",
      ];
      independent.status = "Yes";
      independent.details = ["No restrictions."];
      break;
    case "Dark Green":
      beginner.status = "Yes";
      beginner.details = ["Coach supervision required.", "PFD required."];
      improver.status = "Yes";
      improver.details = ["Coach supervision required.", "PFD required."];
      intermediate.status = "Yes";
      intermediate.details = [
        "Pair up with another intermediate, no coach needed.",
        "Carry a mobile phone.",
        "Familiar boat only.",
        sabrinaSlip,
        "PFD required.",
      ];
      independent.status = "Yes";
      independent.details = ["No restrictions."];
      break;
    case "Amber":
      beginner.status = "Discretion";
      beginner.details = ["Coach's discretion only.", "PFD required."];
      improver.status = "Discretion";
      improver.details = ["Coach's discretion only.", "PFD required."];
      intermediate.status = "Yes";
      intermediate.details = [
        "Supervised by an independent paddler or coach.",
        "PFD required.",
      ];
      independent.status = "Yes";
      independent.details = [
        "Can paddle, may supervise intermediates.",
        "PFD required above the concrete step.",
      ];
      break;
    case "Red":
      beginner.status = "No";
      beginner.details = ["No paddling."];
      improver.status = "No";
      improver.details = ["No paddling."];
      if (riverLevel && riverLevel >= THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_3) {
        intermediate.status = "No";
        intermediate.details = ["No paddling above 10 steps from the car park."];
      } else {
        intermediate.status = "Discretion";
        intermediate.details = ["Coach's discretion only.", "PFD required."];
      }
      independent.status = "Warning";
      independent.details = ["Avoid paddling alone.", "PFD required."];
      break;
    case "No Paddling":
    case "Unknown":
    default:
      beginner.details = ["Not recommended."];
      improver.details = ["Not recommended."];
      intermediate.details = ["Not recommended."];
      independent.details = ["Not recommended."];
      break;
  }

  // PFD warning for high water level, if not in Red conditions (as Red already includes it)
  const addHighWaterPfdWarning = (paddler: PaddlingStatus) => {
    if (paddler.status === "No") return;
    if (paddler.status === "Yes") paddler.status = "Warning";
    const last = paddler.details[paddler.details.length - 1];
    if (last === "PFD required.") {
      paddler.details[paddler.details.length - 1] = "PFD required – river is high.";
    } else {
      paddler.details.push("PFD required – river is high.");
    }
  };

  if (
    overallStatus !== "Red" &&
    riverLevel &&
    riverLevel >= THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_2
  ) {
    addHighWaterPfdWarning(independent);
    addHighWaterPfdWarning(intermediate);
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
                              {statusInfo && statusInfo.details.length > 0 && (
                                <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
                                  {statusInfo.details.map((line, index) => (
                                    <Typography
                                      key={index}
                                      component="li"
                                      variant="body2"
                                    >
                                      {line}
                                    </Typography>
                                  ))}
                                </Box>
                              )}
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
