import {
  Status,
  PaddlerType,
  PaddlingExtraRule,
  PaddlingMatrix,
  PaddlingStatus,
  PaddlingVerdict,
} from "@/types";
import {
  PADDLER_LEVELS,
  WHO_CAN_PADDLE,
  WHO_CAN_PADDLE_EXTRAS,
} from "./config";

// What each paddler level may do for a given status and river level, read
// from WHO_CAN_PADDLE and WHO_CAN_PADDLE_EXTRAS in lib/config.ts. Used for
// the current conditions (Who Can Paddle) and for each forecast hour.

// Whether a verdict has anything to show beyond its headline. Neither card
// offers to expand one that doesn't.
//
// The details are what the headline ("You can paddle", "Coach's
// discretion", "You can't paddle") leaves out - never a restatement of it.
export const hasDetailsToShow = (details: string[]): boolean =>
  details.length > 0;

export const paddlerTypes: PaddlerType[] = [...PADDLER_LEVELS];

// A stored level, or null if it isn't one of today's PADDLER_LEVELS - e.g.
// saved before a level was renamed or removed.
export const toPaddlerLevel = (value: string | null): PaddlerType | null =>
  value !== null && (paddlerTypes as string[]).includes(value)
    ? (value as PaddlerType)
    : null;

const isSingleVerdict = (
  entry: PaddlingVerdict | Record<PaddlerType, PaddlingVerdict>
): entry is PaddlingVerdict => "verdict" in entry;

const toStatus = (v: PaddlingVerdict): PaddlingStatus => ({
  status: v.verdict,
  details: [...(v.details ?? [])],
});

const ruleApplies = (
  { when }: PaddlingExtraRule,
  status: Status,
  riverLevel: number | undefined
): boolean => {
  if (!when) return true;
  if (when.status && !when.status.includes(status)) return false;
  if (when.notStatus && when.notStatus.includes(status)) return false;
  if (
    when.riverLevelAtLeast !== undefined &&
    !(riverLevel !== undefined && riverLevel >= when.riverLevelAtLeast)
  )
    return false;
  return true;
};

const applyRule = (rule: PaddlingExtraRule, paddler: PaddlingStatus) => {
  if (rule.set) {
    const set = toStatus(rule.set);
    paddler.status = set.status;
    paddler.details = set.details;
    return;
  }
  if (paddler.status === "No") return;
  if (rule.yesBecomes && paddler.status === "Yes") {
    paddler.status = rule.yesBecomes;
  }
  if (rule.addDetail) {
    const at =
      rule.replacing !== undefined
        ? paddler.details.indexOf(rule.replacing)
        : -1;
    if (at !== -1) paddler.details[at] = rule.addDetail;
    else paddler.details.push(rule.addDetail);
  }
};

export const getPaddlingMatrix = (
  overallStatus: Status,
  riverLevel?: number
): PaddlingMatrix => {
  const entry = WHO_CAN_PADDLE[overallStatus] ?? WHO_CAN_PADDLE.Unknown;
  const matrix = Object.fromEntries(
    paddlerTypes.map((level) => [
      level,
      toStatus(isSingleVerdict(entry) ? entry : entry[level]),
    ])
  ) as PaddlingMatrix;

  for (const rule of WHO_CAN_PADDLE_EXTRAS) {
    if (!ruleApplies(rule, overallStatus, riverLevel)) continue;
    for (const level of rule.levels) applyRule(rule, matrix[level]);
  }

  return matrix;
};
