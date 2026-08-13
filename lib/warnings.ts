import { parseISO, isWithinInterval, isSameDay, format } from "date-fns";
import { tz, TZDate } from "@date-fns/tz";
import { WeatherWarning } from "@/types";

const LONDON = "Europe/London";

export const londonNow = (): TZDate => new TZDate(new Date(), LONDON);

export const parseLondonISO = (iso: string) =>
  parseISO(iso, { in: tz(LONDON) });

/**
 * Reformats the raw Met Office validity string "HHmm Day DD Mon" as
 * "Day DD Mon, HH:mm" without shifting it, e.g. "0800 Wed 24 Jun" ->
 * "Wed 24 Jun, 08:00". Those times are UTC, so this is only a fallback for
 * when the string couldn't be parsed into an instant.
 */
const formatRawMetTime = (timeStr: string) => {
  if (!timeStr) return "";
  const match = timeStr.match(/^(\d{2})(\d{2})\s+(.*)$/);
  if (match) {
    const [, hh, mm, date] = match;
    return `${date}, ${hh}:${mm}`;
  }
  return timeStr;
};

/**
 * Formats a warning validity time for display in UK local time, e.g.
 * "Wed 24 Jun, 09:00". The Met Office publishes these in UTC, so showing the
 * feed's own wording would read an hour early throughout BST.
 */
export const formatWarningTime = (iso: string | undefined, raw: string) => {
  if (iso) {
    try {
      return format(parseLondonISO(iso), "EEE d MMM, HH:mm");
    } catch {
      // Fall back to the feed's wording below.
    }
  }
  return formatRawMetTime(raw);
};

// True if the warning's valid window contains `now`.
export const isWarningActiveNow = (w: WeatherWarning, now: TZDate): boolean => {
  if (!w.validFromISO || !w.validToISO) return true;
  try {
    return isWithinInterval(now, {
      start: parseLondonISO(w.validFromISO),
      end: parseLondonISO(w.validToISO),
    });
  } catch {
    return true;
  }
};

// True if the warning hasn't expired yet (ignores whether it has started).
export const isWarningNotExpired = (
  w: WeatherWarning,
  now: TZDate
): boolean => {
  if (!w.validToISO) return true;
  try {
    return parseLondonISO(w.validToISO) > now;
  } catch {
    return true;
  }
};

// True if the warning's valid window overlaps the given calendar day ("YYYY-MM-DD").
export const isWarningOnDay = (
  w: WeatherWarning,
  dayISODate: string
): boolean => {
  if (!w.validFromISO || !w.validToISO) return false;
  const dayDate = parseLondonISO(dayISODate);
  const start = parseLondonISO(w.validFromISO);
  const end = parseLondonISO(w.validToISO);
  return (
    isSameDay(dayDate, start, { in: tz(LONDON) }) ||
    isSameDay(dayDate, end, { in: tz(LONDON) }) ||
    (dayDate > start && dayDate < end)
  );
};
