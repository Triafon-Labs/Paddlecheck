import { parseStringPromise } from "xml2js";
import { parse, formatISO } from "date-fns";
import { tz } from "@date-fns/tz";
import { WeatherWarning, WarningSeverity } from "@/types";
import { FetchLiveness, fetchCacheOptions } from "@/lib/fetchCache";
import { MET_OFFICE_WARNINGS_RSS_URL, WARNING_AREA } from "@/lib/config";

/**
 * Parses Met Office time string "HHmm Day DD Mon" into ISO string.
 * The feed quotes its validity times in UTC year-round, so they are an hour
 * behind local time through BST and must be read as UTC rather than as London
 * wall-clock times.
 * e.g. "0800 Wed 24 Jun" -> "2026-06-24T08:00:00Z" (09:00 local, assuming current year)
 */
const parseMetTimeToISO = (timeStr: string, baseDate: Date) => {
  if (!timeStr) return "";
  try {
    // Format is "HHmm EEE d MMM"
    // We need to append the year because the Met Office RSS doesn't include it
    const year = baseDate.getFullYear();
    // The reference date only fills in the units the format string doesn't
    // parse, so use the epoch to zero the seconds rather than picking up
    // whatever the current clock happens to read.
    const reference = new Date(0);
    let parsed = parse(`${timeStr} ${year}`, "HHmm EEE d MMM yyyy", reference, {
      in: tz("UTC"),
    });
    // Year rollover: a warning published in late December can be valid into
    // early January. Naively stamping it with the publication year would date
    // it ~a year in the past, so anything far behind the publication date
    // must really mean next year.
    const SIX_MONTHS_MS = 182 * 24 * 60 * 60 * 1000;
    if (baseDate.getTime() - parsed.getTime() > SIX_MONTHS_MS) {
      parsed = parse(
        `${timeStr} ${year + 1}`,
        "HHmm EEE d MMM yyyy",
        reference,
        { in: tz("UTC") }
      );
    }
    return formatISO(parsed);
  } catch (e) {
    console.error("Failed to parse Met Office time:", timeStr, e);
    return "";
  }
};

/** Fetches and parses Met Office RSS warnings affecting WARNING_AREA. */
export const fetchWeatherWarnings = async (
  liveness: FetchLiveness = {}
): Promise<WeatherWarning[]> => {
  const response = await fetch(
    MET_OFFICE_WARNINGS_RSS_URL,
    fetchCacheOptions(liveness)
  );
  if (!response.ok)
    throw new Error(`Met Office RSS fetch failed: ${response.status}`);

  const xml = await response.text();
  const result = await parseStringPromise(xml);

  const items = result?.rss?.channel?.[0]?.item || [];
  const pubDateStr = result?.rss?.channel?.[0]?.pubDate?.[0];
  const pubDate = pubDateStr ? new Date(pubDateStr) : new Date();

  const warnings: WeatherWarning[] = [];

  for (const item of items) {
    const title = item.title?.[0] || "";
    const description = item.description?.[0] || "";
    const link = item.link?.[0] || "";

    // Only include warnings that mention the configured area
    if (description.toLowerCase().includes(WARNING_AREA.toLowerCase())) {
      const severityMatch = title.match(/^(Yellow|Amber|Red)/i);
      const rawSeverity = severityMatch ? severityMatch[0] : "Yellow";
      const severity = (rawSeverity.charAt(0).toUpperCase() +
        rawSeverity.slice(1).toLowerCase()) as WarningSeverity;

      const typeMatch = title.match(/warning of (.*) affecting/i);
      const type = typeMatch ? typeMatch[1].trim() : "Weather Warning";

      const validMatch = description.match(/valid from (.*) to (.*)$/i);
      const validFrom = validMatch ? validMatch[1].trim() : "";
      const validTo = validMatch ? validMatch[2].trim() : "";

      warnings.push({
        severity,
        type,
        headline: title,
        description,
        link,
        validFrom,
        validTo,
        validFromISO: parseMetTimeToISO(validFrom, pubDate),
        validToISO: parseMetTimeToISO(validTo, pubDate),
      });
    }
  }

  const severityOrder: Record<WarningSeverity, number> = {
    Red: 0,
    Amber: 1,
    Yellow: 2,
  };

  warnings.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  return warnings;
};
