import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Collapse,
  Skeleton,
  Grow,
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
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { m3Spring, spring, springTransition } from "@/lib/m3-palette";

export const PADDLER_LEVEL_CHANGED_EVENT = "paddlecheck:paddler-level-changed";

interface PaddlingMatrixCardProps {
  overallStatus?: Status;
  riverLevel?: number;
  loading?: boolean;
}

// Colours each paddler's status icon using the same RAG colour tokens as
// the rest of the app.
const STATUS_UI: Record<
  PaddlingStatusValue,
  { color: string; icon: React.ElementType }
> = {
  Yes: { color: ragStatus["Light Green"].color, icon: CheckCircleOutlined },
  No: { color: ragStatus["Red"].color, icon: CancelOutlined },
  Discretion: { color: ragStatus["Amber"].color, icon: WarningAmberOutlined },
  Warning: { color: ragStatus["Amber"].color, icon: WarningAmberOutlined },
};

const UNKNOWN_UI = {
  color: ragStatus["Unknown"].color,
  icon: HelpOutlined,
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
        intermediate.details = [
          "No paddling above 10 steps from the car park.",
        ];
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
      paddler.details[paddler.details.length - 1] =
        "PFD required – river is high.";
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

  // Everyone below Independent needs to be easy to spot from the bank and
  // from other boats, whatever the conditions. This isn't PPE-grade hi-vis -
  // a fluorescent top, or a bib pulled over your kit, is enough. Applied
  // after the PFD rules above so it lands last in the list and doesn't
  // disturb their "PFD required." lookups.
  for (const paddler of [beginner, improver, intermediate]) {
    if (paddler.status !== "No") {
      paddler.details.push("Wear a fluorescent top or bib.");
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
  const [selectedLevel, setSelectedLevel] = useState<PaddlerType | null>(null);

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
      STORAGE_KEYS.PADDLER_LEVEL
    ) as PaddlerType | null;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(openStateForLevel(savedLevel));
    setSelectedLevel(savedLevel);

    // Custom event fires in this same tab (the "storage" event only fires in
    // *other* tabs per spec), so the matrix updates immediately when the
    // level is changed in Settings without needing a reload.
    const handleLevelChanged = () => {
      const newLevel = localStorage.getItem(
        STORAGE_KEYS.PADDLER_LEVEL
      ) as PaddlerType | null;
      setOpen(openStateForLevel(newLevel));
      setSelectedLevel(newLevel);
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.PADDLER_LEVEL) {
        const newLevel = event.newValue as PaddlerType | null;
        setOpen(openStateForLevel(newLevel));
        setSelectedLevel(newLevel);
      }
    };

    window.addEventListener(PADDLER_LEVEL_CHANGED_EVENT, handleLevelChanged);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(
        PADDLER_LEVEL_CHANGED_EVENT,
        handleLevelChanged
      );
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
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}
          >
            {paddlerTypes.map((paddler) => {
              // Mirrors the open-state resolution below (read directly,
              // rather than from `open` state, since that's only populated
              // once the effect below runs) so a row that's about to expand
              // by default reserves the space for its detail lines too.
              const savedLevel =
                typeof window !== "undefined"
                  ? (localStorage.getItem(
                      STORAGE_KEYS.PADDLER_LEVEL
                    ) as PaddlerType | null)
                  : null;
              const isOpen = savedLevel ? paddler === savedLevel : true;
              return (
                <Box
                  key={paddler}
                  sx={{
                    backgroundColor: "surfaces.containerHigh",
                    borderRadius: 1.5,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 1.5,
                      py: 1.25,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Skeleton
                        variant="circular"
                        width={22}
                        height={22}
                        animation="wave"
                      />
                      <Skeleton
                        variant="text"
                        width={100}
                        height={28}
                        animation="wave"
                      />
                    </Box>
                    <Skeleton
                      variant="circular"
                      width={20}
                      height={20}
                      animation="wave"
                    />
                  </Box>
                  {isOpen && (
                    <Box sx={{ pl: 4.5, pr: 1.5, pt: 0.5, pb: 1.5 }}>
                      <Skeleton
                        variant="text"
                        width="90%"
                        height={20}
                        animation="wave"
                        sx={{ mb: 0.75 }}
                      />
                      <Skeleton
                        variant="text"
                        width="70%"
                        height={20}
                        animation="wave"
                      />
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        ) : (
          <Grow in appear {...springTransition()}>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}
            >
              {paddlerTypes.map((paddler) => {
                const statusInfo = paddlingMatrix[paddler];
                const ui = statusInfo
                  ? STATUS_UI[statusInfo.status]
                  : UNKNOWN_UI;
                const StatusIcon = ui.icon;
                const isOpen = open[paddler];
                const isSelected = paddler === selectedLevel;
                return (
                  <Box
                    key={paddler}
                    sx={{
                      backgroundColor: "surfaces.containerHigh",
                      borderRadius: 1.5,
                      overflow: "hidden",
                      border: "1.5px solid",
                      borderColor: isSelected ? ui.color : "transparent",
                    }}
                  >
                    <Box
                      onClick={() => handleToggle(paddler)}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isOpen}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleToggle(paddler);
                        }
                      }}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 1.5,
                        py: 1.25,
                        cursor: "pointer",
                        position: "relative",
                        // These rows are real buttons (click, Enter/Space,
                        // aria-expanded) but were the only interactive surface
                        // in the app with no M3 state layer and no focus
                        // indicator - a keyboard user had no way to tell which
                        // row they were on. The overlay is the standard M3
                        // onSurface state layer at 8%/10%.
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          inset: 0,
                          backgroundColor: "text.primary",
                          opacity: 0,
                          transition: spring("opacity", m3Spring.effectsFast),
                          pointerEvents: "none",
                        },
                        "&:hover::after": { opacity: 0.08 },
                        "&:active::after": { opacity: 0.1 },
                        "&:focus-visible": {
                          outline: "3px solid",
                          outlineColor: "primary.main",
                          outlineOffset: -3,
                        },
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <StatusIcon sx={{ color: ui.color, fontSize: 22 }} />
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600 }}
                        >
                          {paddler}
                        </Typography>
                      </Box>
                      <ExpandMore
                        sx={{
                          color: "text.secondary",
                          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                          transition: spring("transform", m3Spring.spatialFast),
                        }}
                      />
                    </Box>
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                      {statusInfo && statusInfo.details.length > 0 && (
                        <Box
                          component="ul"
                          sx={{
                            m: 0,
                            pl: 4.5,
                            pr: 1.5,
                            pt: 0.5,
                            pb: 1.5,
                            "& li:not(:last-of-type)": { mb: 0.75 },
                          }}
                        >
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
                    </Collapse>
                  </Box>
                );
              })}
            </Box>
          </Grow>
        )}
      </CardContent>
    </Card>
  );
};

export default PaddlingMatrixCard;
