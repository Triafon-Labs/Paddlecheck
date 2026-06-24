import { NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";
import { WeatherWarning, WarningSeverity } from "@/types";
import { parse, formatISO } from "date-fns";
import { tz } from "@date-fns/tz";

const MET_OFFICE_RSS_URL = "https://www.metoffice.gov.uk/public/data/PWSCache/WarningsRSS/Region/wm";

/**
 * Parses Met Office time string "HHmm Day DD Mon" into ISO string
 * e.g. "0800 Wed 24 Jun" -> "2026-06-24T08:00:00+01:00" (assuming current year, BST)
 */
const parseMetTimeToISO = (timeStr: string, baseDate: Date) => {
  if (!timeStr) return "";
  try {
    // Format is "HHmm EEE d MMM"
    // We need to append the year because the Met Office RSS doesn't include it
    const year = baseDate.getFullYear();
    const parsed = parse(`${timeStr} ${year}`, "HHmm EEE d MMM yyyy", new Date(), {
      in: tz("Europe/London"),
    });
    return formatISO(parsed);
  } catch (e) {
    console.error("Failed to parse Met Office time:", timeStr, e);
    return "";
  }
};

export async function GET() {
  try {
    const response = await fetch(MET_OFFICE_RSS_URL, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch warnings" }, { status: 500 });
    }

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

      // Only include warnings that mention Worcestershire
      if (description.toLowerCase().includes("worcestershire")) {
        const severityMatch = title.match(/^(Yellow|Amber|Red)/i);
        const severity = (severityMatch ? severityMatch[0] : "Yellow") as WarningSeverity;

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

    warnings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return NextResponse.json(warnings);
  } catch (error) {
    console.error("Error fetching weather warnings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
