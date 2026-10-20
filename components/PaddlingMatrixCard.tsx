import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Collapse,
  Skeleton,
  Grow,
  Stack,
  SvgIcon,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
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
import {
  collapseMotion,
  m3Spring,
  spring,
  springTransition,
} from "@/lib/m3-palette";

export const PADDLER_LEVEL_CHANGED_EVENT = "paddlecheck:paddler-level-changed";

interface PaddlingMatrixCardProps {
  overallStatus?: Status;
  riverLevel?: number;
  loading?: boolean;
}

// Each paddler's status is a face on a solid disc of its RAG colour, with the
// features in that colour's paired on-colour. The faces are the features of
// MUI's outlined sentiment icons (EmojiEmotions, SentimentSatisfied,
// SentimentNeutral, SentimentDissatisfied) and the "?" of Help, drawn without
// their outer ring. As outlines, the green and amber faces sat at about 2:1
// on the light rows and the red one at about 1.5:1 on the dark navy; filling
// the disc puts the status colour over the whole face and the features at
// the on-colour's 6.5:1 or better.
const FACE_EYES = (
  <>
    <circle cx="15.5" cy="9.5" r="1.5" />
    <circle cx="8.5" cy="9.5" r="1.5" />
  </>
);
const FACE_FEATURES = {
  grin: (
    <>
      {FACE_EYES}
      <path d="M12 18c2.28 0 4.22-1.66 5-4H7c.78 2.34 2.72 4 5 4" />
    </>
  ),
  smile: (
    <>
      {FACE_EYES}
      <path d="M12 16c-1.48 0-2.75-.81-3.45-2H6.88c.8 2.05 2.79 3.5 5.12 3.5s4.32-1.45 5.12-3.5h-1.67c-.7 1.19-1.97 2-3.45 2z" />
    </>
  ),
  neutral: (
    <>
      {FACE_EYES}
      <path d="M9 14h6v1.5H9z" />
    </>
  ),
  frown: (
    <>
      {FACE_EYES}
      <path d="M12 14c-2.33 0-4.32 1.45-5.12 3.5h1.67c.69-1.19 1.97-2 3.45-2s2.75.81 3.45 2h1.67c-.8-2.05-2.79-3.5-5.12-3.5z" />
    </>
  ),
  unknown: (
    <path d="M13 19h-2v-2h2zm2.07-7.75-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25" />
  ),
};

type FaceKind = keyof typeof FACE_FEATURES;

const StatusFace: React.FC<{
  face: FaceKind;
  color: string;
  onColor: string;
  size: number;
}> = ({ face, color, onColor, size }) => (
  <SvgIcon sx={{ fontSize: size, flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" fill={color} />
    <g fill={onColor}>{FACE_FEATURES[face]}</g>
  </SvgIcon>
);

// The faces are meant to read like someone telling you how it is, rather
// than as bare status markers. `headline` and `short` exist because
// Discretion and Warning share the amber - "only at a coach's discretion" and
// "yes, but the river is high" can't rest on two similar faces alone, so the
// words say which it is.
const STATUS_UI: Record<
  PaddlingStatusValue,
  {
    color: string;
    onColor: string;
    face: FaceKind;
    headline: string;
    short: string;
  }
> = {
  Yes: {
    color: ragStatus["Light Green"].color,
    onColor: ragStatus["Light Green"].onColor,
    face: "grin",
    headline: "You can paddle",
    short: "Can paddle",
  },
  Warning: {
    color: ragStatus["Amber"].color,
    onColor: ragStatus["Amber"].onColor,
    face: "smile",
    headline: "You can paddle, with caveats",
    short: "With caveats",
  },
  Discretion: {
    color: ragStatus["Amber"].color,
    onColor: ragStatus["Amber"].onColor,
    face: "neutral",
    headline: "Coach's discretion",
    short: "Coach's discretion",
  },
  No: {
    color: ragStatus["Red"].color,
    onColor: ragStatus["Red"].onColor,
    face: "frown",
    headline: "You can't paddle today",
    short: "Cannot paddle",
  },
};

const UNKNOWN_UI = {
  color: ragStatus["Unknown"].color,
  onColor: ragStatus["Unknown"].onColor,
  face: "unknown" as const,
  headline: "Conditions unavailable",
  short: "Unknown",
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

  const sabrinaSlip = "Stay between Sabrina Bridge and the Slip";

  switch (overallStatus) {
    case "Light Green":
      beginner.status = "Warning";
      beginner.details = ["Coach supervision and PFD required"];
      improver.status = "Warning";
      improver.details = [
        "No coach needed, but paddle with at least one other improver or intermediate (preferably more)",
        "Someone in the group carries a mobile phone",
        "Familiar boat only",
        sabrinaSlip,
        "PFD required",
      ];
      intermediate.status = "Yes";
      intermediate.details = [
        "Can paddle solo",
        "Carry a mobile phone",
        "Familiar boat only",
        sabrinaSlip,
        "PFD required",
      ];
      independent.status = "Yes";
      independent.details = ["No restrictions"];
      break;
    case "Dark Green":
      beginner.status = "Warning";
      beginner.details = ["Coach supervision and PFD required"];
      improver.status = "Warning";
      improver.details = ["Coach supervision and PFD required"];
      intermediate.status = "Warning";
      intermediate.details = [
        "Pair up with another intermediate, no coach needed",
        "Solo K2 crews must be able to self-rescue",
        "Carry a mobile phone",
        "Familiar boat only",
        sabrinaSlip,
        "PFD required",
      ];
      independent.status = "Yes";
      independent.details = ["No restrictions"];
      break;
    case "Amber":
      beginner.status = "Discretion";
      beginner.details = ["Coach's discretion only, PFD required"];
      improver.status = "Discretion";
      improver.details = ["Coach's discretion only, PFD required"];
      intermediate.status = "Discretion";
      // The PFD line stays a bullet of its own here rather than merging into
      // the one above: addHighWaterPfdWarning below rewrites it in place when
      // the river is up, and it can only find it if it stands alone.
      intermediate.details = [
        "Supervised by an independent paddler or coach",
        "PFD required",
      ];
      independent.status = "Yes";
      independent.details = [
        "Can paddle, may supervise intermediates",
        "PFD required above the concrete step",
      ];
      break;
    case "Red":
      beginner.status = "No";
      beginner.details = ["No paddling"];
      improver.status = "No";
      improver.details = ["No paddling"];
      if (riverLevel && riverLevel >= THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_3) {
        intermediate.status = "No";
        intermediate.details = ["No paddling above 10 steps from the car park"];
      } else {
        intermediate.status = "Discretion";
        intermediate.details = ["Coach's discretion only, PFD required"];
      }
      independent.status = "Warning";
      independent.details = ["Avoid paddling alone, PFD required"];
      break;
    // Split from Unknown below, which it used to share a branch with. The two
    // mean opposite things - one is "the river is dangerous", the other is
    // "we could not find out" - and the single line they shared, "Not
    // recommended.", was far too mild for a gauge reading above the no-paddling
    // threshold or a thunderstorm overhead.
    case "No Paddling":
      for (const paddler of [beginner, improver, intermediate, independent]) {
        paddler.details = [
          "Do not go on the water",
          "Applies to every level, independents included",
        ];
      }
      break;
    case "Unknown":
    default:
      for (const paddler of [beginner, improver, intermediate, independent]) {
        paddler.details = [
          "Conditions could not be checked",
          "Ask a coach before paddling",
        ];
      }
      break;
  }

  // PFD warning for high water level, if not in Red conditions (as Red already includes it)
  const addHighWaterPfdWarning = (paddler: PaddlingStatus) => {
    if (paddler.status === "No") return;
    if (paddler.status === "Yes") paddler.status = "Warning";
    const last = paddler.details[paddler.details.length - 1];
    if (last === "PFD required") {
      paddler.details[paddler.details.length - 1] =
        "PFD required – river is high";
    } else {
      paddler.details.push("PFD required – river is high");
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

  // From the club email introducing bibs: "All coaching groups of Adult and
  // Junior Beginners and Intermediate paddlers will wear luminous bibs." It
  // postdates the printed rules, which don't mention hi-vis at all.
  //
  // Improvers are not named in that sentence and are carried here anyway, and
  // the email scopes the rule to coaching groups where this applies to any
  // paddling level - both deliberately wider than the source, since a bib
  // costs nothing and being seen from the bank is the point. Narrow both if
  // the club wants the app to state the rule exactly.
  //
  // Applied after the PFD rules above so it lands last in the list and doesn't
  // disturb the "PFD required" lookup above.
  for (const paddler of [beginner, improver, intermediate]) {
    if (paddler.status !== "No") {
      paddler.details.push("Wear a luminous bib");
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

  // The verdict for the reader's own level, lifted out of the accordion: it
  // is the question this card exists to answer, and it used to be a 22px icon
  // on a row weighted the same as the three levels that don't apply. The
  // others stay, one compact line each, still expandable.
  const renderCompactRow = (paddler: PaddlerType) => {
    const statusInfo = paddlingMatrix[paddler];
    const ui = statusInfo ? STATUS_UI[statusInfo.status] : UNKNOWN_UI;
    const isOpen = open[paddler];
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
            gap: 1,
            px: 1.5,
            py: 1,
            cursor: "pointer",
            position: "relative",
            // These rows are real buttons (click, Enter/Space, aria-expanded)
            // and carry the M3 onSurface state layer at 8%/10% plus a focus
            // indicator, so a keyboard user can tell which row they are on.
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
          <StatusFace
            face={ui.face}
            color={ui.color}
            onColor={ui.onColor}
            size={20}
          />
          <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>
            {paddler}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {ui.short}
          </Typography>
          <ExpandMore
            sx={{
              fontSize: 20,
              color: "text.secondary",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: spring("transform", m3Spring.spatialFast),
            }}
          />
        </Box>
        <Collapse
          in={isOpen}
          timeout="auto"
          unmountOnExit
          easing={collapseMotion.easing}
        >
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
                <Typography key={index} component="li" variant="body2">
                  {line}
                </Typography>
              ))}
            </Box>
          )}
        </Collapse>
      </Box>
    );
  };

  const selectedInfo = selectedLevel
    ? paddlingMatrix[selectedLevel]
    : undefined;
  const otherLevels = selectedLevel
    ? paddlerTypes.filter((paddler) => paddler !== selectedLevel)
    : paddlerTypes;

  const renderVerdict = () => {
    if (!selectedLevel || !selectedInfo) return null;
    const ui = STATUS_UI[selectedInfo.status];
    return (
      <Box
        sx={{
          display: "flex",
          borderRadius: "16px",
          overflow: "hidden",
          backgroundColor: "surfaces.containerHighest",
        }}
      >
        {/* The status colour arrives as an accent rather than as a fill. A
            filled panel would repeat the status card's treatment directly
            above it, leaving the page with two full-width colour slabs
            competing to be the headline. */}
        <Box
          sx={{ width: 6, backgroundColor: ui.color, flexShrink: 0 }}
          aria-hidden
        />
        <Box sx={{ p: 2, flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <StatusFace
              face={ui.face}
              color={ui.color}
              onColor={ui.onColor}
              size={32}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ display: "block", lineHeight: 1.2 }}
              >
                You - {selectedLevel}
              </Typography>
              {/* A step below the h5 card title rather than level with it.
                  At h5 the verdict matched "Who Can Paddle" above it exactly,
                  so the card read as two headlines of equal rank instead of a
                  title and its answer. */}
              <Typography
                component="p"
                sx={{ fontSize: "1.25rem", fontWeight: 500, lineHeight: 1.2 }}
              >
                {ui.headline}
              </Typography>
            </Box>
          </Box>
          {selectedInfo.details.length > 0 && (
            <Box
              component="ul"
              sx={{ m: 0, mt: 1.5, pl: 2.5, "& li": { mb: 0.25 } }}
            >
              {selectedInfo.details.map((line, index) => (
                <Typography key={index} component="li" variant="body2">
                  {line}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  const savedLevelForSkeleton =
    typeof window !== "undefined"
      ? (localStorage.getItem(STORAGE_KEYS.PADDLER_LEVEL) as PaddlerType | null)
      : null;

  return (
    <Card sx={{ width: "100%" }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Who Can Paddle
        </Typography>
        {loading ? (
          <Box sx={{ mt: 1 }}>
            {/* Mirrors the layout below, reading the saved level directly
                rather than from state (which is only populated once the effect
                runs) so the skeleton reserves the shape the card will take. */}
            {savedLevelForSkeleton && (
              <Skeleton
                variant="rounded"
                height={150}
                animation="wave"
                sx={{ borderRadius: "16px", mb: 2 }}
              />
            )}
            <Skeleton
              variant="text"
              width={100}
              height={20}
              animation="wave"
              sx={{ mb: 1 }}
            />
            <Stack spacing={0.75}>
              {Array.from({
                length: savedLevelForSkeleton
                  ? paddlerTypes.length - 1
                  : paddlerTypes.length,
              }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  height={savedLevelForSkeleton ? 40 : 96}
                  animation="wave"
                  sx={{ borderRadius: 1.5 }}
                />
              ))}
            </Stack>
          </Box>
        ) : (
          <Grow in appear {...springTransition()}>
            <Box sx={{ mt: 1 }}>
              {selectedLevel && selectedInfo ? (
                renderVerdict()
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Set your level in Settings to see what applies to you first.
                </Typography>
              )}
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mt: 2, mb: 1 }}
              >
                {selectedLevel && selectedInfo ? "Other levels" : "All levels"}
              </Typography>
              <Stack spacing={0.75}>{otherLevels.map(renderCompactRow)}</Stack>
            </Box>
          </Grow>
        )}
      </CardContent>
    </Card>
  );
};

export default PaddlingMatrixCard;
