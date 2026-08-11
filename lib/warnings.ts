import { parseISO, isWithinInterval, isSameDay } from "date-fns";
import { tz, TZDate } from "@date-fns/tz";
import { WeatherWarning } from "@/types";

const LONDON = "Europe/London";

export const londonNow = (): TZDate => new TZDate(new Date(), LONDON);

export const parseLondonISO = (iso: string) =>
  parseISO(iso, { in: tz(LONDON) });

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
