import { NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";
import { WeatherWarning, WarningSeverity } from "@/types";

const MET_OFFICE_RSS_URL = "https://www.metoffice.gov.uk/public/data/PWSCache/WarningsRSS/Region/wm";

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
    const warnings: WeatherWarning[] = [];

    for (const item of items) {
      const title = item.title?.[0] || "";
      const description = item.description?.[0] || "";
      const link = item.link?.[0] || "";

      // Only include warnings that mention Worcestershire
      if (description.toLowerCase().includes("worcestershire")) {
        const severityMatch = title.match(/^(Yellow|Amber|Red)/i);
        const severity = (severityMatch ? severityMatch[0] : "Yellow") as WarningSeverity;

        // Extract type: e.g. "extreme heat" from "Red warning of extreme heat affecting West Midlands"
        const typeMatch = title.match(/warning of (.*) affecting/i);
        const type = typeMatch ? typeMatch[1].trim() : "Weather Warning";

        // Try to extract validity
        // Format: "valid from 0800 Wed 24 Jun to 2000 Thu 25 Jun"
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
        });
      }
    }

    // Sort by severity: Red > Amber > Yellow
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
