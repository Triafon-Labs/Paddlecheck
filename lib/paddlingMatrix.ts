import { Status, PaddlerType, PaddlingMatrix, PaddlingStatus } from "@/types";
import { THRESHOLDS, PADDLER_LEVELS } from "./config";

// What each paddler level may do, from the club's rules, for a given RAG
// status and river level. Used for the current conditions (Who Can Paddle)
// and for each forecast hour.
// Whether a verdict has anything to show beyond its headline. Neither card
// offers to expand one that doesn't.
//
// The details below are what the headline ("You can paddle", "Coach's
// discretion", "You can't paddle") leaves out - never a restatement of it.
// An independent on green, or a beginner on red, has nothing more to say.
export const hasDetailsToShow = (details: string[]): boolean =>
  details.length > 0;

export const getPaddlingMatrix = (
  overallStatus: Status,
  riverLevel?: number
): PaddlingMatrix => {
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
        "May paddle solo",
        "Carry a mobile phone",
        "Familiar boat only",
        sabrinaSlip,
        "PFD required",
      ];
      independent.status = "Yes";
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
      break;
    case "Amber":
      beginner.status = "Discretion";
      beginner.details = ["PFD required"];
      improver.status = "Discretion";
      improver.details = ["PFD required"];
      // The rules allow this outright with supervision - "In AMBER
      // conditions they can be supervised by an Independent paddler or club
      // coach" - rather than leaving it to a coach's discretion, as they do
      // for beginners and improvers.
      intermediate.status = "Warning";
      // The PFD line stays a bullet of its own here rather than merging into
      // the one above: addHighWaterPfdWarning below rewrites it in place when
      // the river is up, and it can only find it if it stands alone.
      intermediate.details = [
        "Must be supervised by an independent paddler or club coach",
        "PFD required",
      ];
      independent.status = "Yes";
      independent.details = [
        "May supervise intermediates",
        "PFD required above the concrete step",
      ];
      break;
    case "Red":
      beginner.status = "No";
      improver.status = "No";
      if (riverLevel && riverLevel >= THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_3) {
        intermediate.status = "No";
        intermediate.details = ["No paddling above 10 steps from the car park"];
      } else {
        intermediate.status = "Discretion";
        intermediate.details = ["PFD required"];
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
        paddler.details = ["Applies to every level, independents included"];
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

  // One entry per level in PADDLER_LEVELS (lib/config.ts) - TypeScript
  // flags a level missing here, or one here that no longer exists.
  return {
    Beginner: beginner,
    Improver: improver,
    Intermediate: intermediate,
    Independent: independent,
  };
};

export const paddlerTypes: PaddlerType[] = [...PADDLER_LEVELS];

// A stored level, or null if it isn't one of today's PADDLER_LEVELS - e.g.
// saved before a level was renamed or removed.
export const toPaddlerLevel = (value: string | null): PaddlerType | null =>
  value !== null && (paddlerTypes as string[]).includes(value)
    ? (value as PaddlerType)
    : null;
