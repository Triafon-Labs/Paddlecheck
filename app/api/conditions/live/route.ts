import { NextResponse } from "next/server";
import { getConditionsPayload } from "@/lib/conditions";

// Bypasses the 15-minute cache entirely for a genuinely live fetch. The
// client calls this when /api/conditions comes back stale (e.g. the first
// open of the day, after an overnight gap with no visitors) instead of
// waiting for someone else's request to happen to land after the cache's
// background revalidation finishes.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getConditionsPayload({ live: true }));
}
