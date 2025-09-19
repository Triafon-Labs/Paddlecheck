import React from "react";
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
} from "@mui/material";
import {
  CheckCircleOutline,
  CancelOutlined,
  WarningAmberOutlined,
  HelpOutline,
} from "@mui/icons-material";
import {
  Status,
  PaddlerType,
  PaddlingMatrix,
  PaddlingStatus,
  PaddlingStatusValue,
} from "@/types";

interface PaddlingMatrixCardProps {
  overallStatus: Status;
  riverLevel?: number;
}

const getStatusIcon = (status: PaddlingStatusValue) => {
  switch (status) {
    case "Yes":
      return <CheckCircleOutline style={{ color: "green" }} />;
    case "No":
      return <CancelOutlined style={{ color: "red" }} />;
    case "Discretion":
      return <WarningAmberOutlined style={{ color: "orange" }} />;
    case "Warning":
      return <WarningAmberOutlined style={{ color: "orange" }} />;
    default:
      return <HelpOutline style={{ color: "grey" }} />;
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
      beginner.status = "Yes";
      beginner.details = "Must be supervised by a club coach and wear a PFD.";
      junior.status = "Yes";
      junior.details =
        "Must be supervised by a club coach or independent paddler and wear a PFD.";
      improver.status = "Yes";
      improver.details =
        "Can paddle in a group without a coach under Annex rules. Must wear a PFD.";
      intermediate.status = "Yes";
      intermediate.details =
        "Can paddle solo under Annex rules. Must wear a PFD.";
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
        "Can paddle with at least one other intermediate paddler under Annex rules. Must wear a PFD.";
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
        "Strongly advised not to paddle alone. Must wear a PFD.";
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

  if (riverLevel && riverLevel >= 1.48) {
    if (independent.status === "Yes") {
      independent.status = "Warning";
      independent.details +=
        " Must wear PFD as river is on or above concrete landing stage.";
    } else if (independent.status !== "No") {
      independent.details +=
        " Must wear PFD as river is on or above concrete landing stage.";
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
    "Beginner",
    "Junior",
    "Improver",
    "Intermediate",
    "Independent",
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Who Can Paddle
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Paddler</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paddlerTypes.map((paddler) => {
                const statusInfo = paddlingMatrix[paddler];
                return (
                  <TableRow key={paddler}>
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
                    <TableCell>
                      {statusInfo ? statusInfo.details : ""}
                    </TableCell>
                  </TableRow>
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
