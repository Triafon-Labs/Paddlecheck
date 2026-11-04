import { KayakConditions, DayForecast } from "@/types";
import {
  buildHourlyForecastText,
  buildNextDaytimeOutlook,
  relativeDayLabel,
  isDarkSlot,
} from "@/lib/forecast";
import { getLondonHHMM, hhmmOfISO } from "@/lib/time";
import { isWarningOnDay } from "@/lib/warnings";

export interface BriefingInputs {
  conditions: KayakConditions;
  hourlyForecast: string | null;
  currentlyDark: boolean;
  currentTime: string;
  // The daylight window the summary covers: "the rest of today", or - when
  // it's already dark - "later today" or "tomorrow".
  period: string | null;
  outlook: { dayLabel: string; rangesText: string } | null;
}

// Everything the AI briefing is written from. Built on the server
// (/api/briefing) from its own conditions data rather than accepted from the
// browser, so a visitor can't put text of their choosing into the prompt.
export function buildBriefingInputs(
  conditions: KayakConditions,
  forecastDays: DayForecast[] | null,
  now: Date = new Date()
): BriefingInputs {
  const todayForecast = forecastDays?.[0] ?? null;
  const currentTime = getLondonHHMM(now);
  const todaySunrise = todayForecast?.sunrise
    ? hhmmOfISO(todayForecast.sunrise)
    : null;
  const todaySunset = todayForecast?.sunset
    ? hhmmOfISO(todayForecast.sunset)
    : null;
  // Derive dark from sunrise/sunset times rather than conditions.dark, which can be stale
  const currentlyDark = todayForecast
    ? (todaySunrise !== null && currentTime < todaySunrise) ||
      (todaySunset !== null && currentTime >= todaySunset)
    : (conditions.dark ?? false);

  // Find the target day being summarized
  let targetDay = todayForecast;
  let targetDayIndex = 0;
  if (currentlyDark && forecastDays) {
    const dayIndex = forecastDays.findIndex((day) =>
      day.graphData.some((pt) => !isDarkSlot(pt))
    );
    if (dayIndex !== -1) {
      targetDay = forecastDays[dayIndex];
      targetDayIndex = dayIndex;
    }
  }

  // Naming the period explicitly keeps the summary from reading as if a future
  // day's figures apply right now ("levels will stay low, around 0.33 m in the
  // morning" when the morning in question is tomorrow's).
  const period = !targetDay
    ? null
    : currentlyDark
      ? relativeDayLabel(targetDayIndex)
      : "the rest of today";

  const hourlyForecast = targetDay ? buildHourlyForecastText(targetDay) : null;
  const outlook = currentlyDark ? buildNextDaytimeOutlook(forecastDays) : null;

  // Only surface warnings that actually fall within the day being summarised
  // (today, or the next daylight day if it's currently dark) - a warning for
  // later in the week shouldn't show up in "today's" briefing.
  const relevantWarnings = targetDay
    ? conditions.warnings?.filter((w) => isWarningOnDay(w, targetDay.date)) ||
      []
    : [];

  return {
    conditions: { ...conditions, warnings: relevantWarnings },
    hourlyForecast,
    currentlyDark,
    currentTime,
    period,
    outlook: outlook
      ? { dayLabel: outlook.dayLabel, rangesText: outlook.rangesText }
      : null,
  };
}
