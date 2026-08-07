import { NextResponse } from "next/server";
import { getConditionsPayload } from "@/lib/conditions";

// Caches the whole handler's output (not just the fetches inside it) so
// fetchedAt below is frozen at the time the data was actually fetched and
// replayed as-is on every cache hit, instead of being recomputed - and
// looking "live" - on every request.
export const revalidate = 900;

export async function GET() {
  return NextResponse.json(await getConditionsPayload());
}
