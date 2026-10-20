import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Collapse,
  Skeleton,
  Grow,
  Stack,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { Status, PaddlerType } from "@/types";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import {
  getPaddlingMatrix,
  hasDetailsToShow,
  paddlerTypes,
} from "@/lib/paddlingMatrix";
import { usePaddlerLevel } from "@/lib/usePaddlerLevel";
import {
  StatusFace,
  PADDLING_STATUS_UI,
  UNKNOWN_PADDLING_UI,
} from "./StatusFace";
import {
  collapseMotion,
  m3Spring,
  spring,
  springTransition,
} from "@/lib/m3-palette";

interface PaddlingMatrixCardProps {
  overallStatus?: Status;
  riverLevel?: number;
  loading?: boolean;
}

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
  const savedLevel = usePaddlerLevel();
  const selectedLevel = savedLevel ?? null;

  // Open the reader's own level, or every level when none is set, whenever
  // the level is first read or changes - adjusted during render rather than
  // in an effect, so a changed level never paints with the old rows open.
  const [openedFor, setOpenedFor] = useState<PaddlerType | null | undefined>(
    undefined
  );
  if (savedLevel !== undefined && savedLevel !== openedFor) {
    setOpenedFor(savedLevel);
    setOpen(
      paddlerTypes.reduce(
        (acc, paddler) => {
          acc[paddler] = savedLevel ? paddler === savedLevel : true;
          return acc;
        },
        {} as Record<PaddlerType, boolean>
      )
    );
  }

  const handleToggle = (paddler: PaddlerType) => {
    setOpen((prevOpen) => ({ ...prevOpen, [paddler]: !prevOpen[paddler] }));
  };

  // The verdict for the reader's own level, lifted out of the accordion: it
  // is the question this card exists to answer, and it used to be a 22px icon
  // on a row weighted the same as the three levels that don't apply. The
  // others stay, one compact line each, expandable where there's more to show.
  const renderCompactRow = (paddler: PaddlerType) => {
    const statusInfo = paddlingMatrix[paddler];
    const ui = statusInfo
      ? PADDLING_STATUS_UI[statusInfo.status]
      : UNKNOWN_PADDLING_UI;
    // A row with nothing more to show isn't a button: no chevron, no state
    // layer, nothing to open. A spacer keeps its label in line with the rest.
    const expandable = !!statusInfo && hasDetailsToShow(statusInfo.details);
    const isOpen = expandable && open[paddler];
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
          {...(expandable && {
            onClick: () => handleToggle(paddler),
            role: "button",
            tabIndex: 0,
            "aria-expanded": isOpen,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleToggle(paddler);
              }
            },
          })}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 1,
            cursor: expandable ? "pointer" : "default",
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
            ...(expandable && {
              "&:hover::after": { opacity: 0.08 },
              "&:active::after": { opacity: 0.1 },
            }),
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
          {expandable ? (
            <ExpandMore
              sx={{
                fontSize: 20,
                color: "text.secondary",
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: spring("transform", m3Spring.spatialFast),
              }}
            />
          ) : (
            <Box sx={{ width: 20, flexShrink: 0 }} aria-hidden />
          )}
        </Box>
        <Collapse
          in={isOpen}
          timeout="auto"
          unmountOnExit
          easing={collapseMotion.easing}
        >
          {expandable && (
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
    const ui = PADDLING_STATUS_UI[selectedInfo.status];
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
          {hasDetailsToShow(selectedInfo.details) && (
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
