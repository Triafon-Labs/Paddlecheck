import { NextResponse } from "next/server";
import { fetchWeatherWarnings } from "@/lib/metOfficeWarnings";

export async function GET() {
  try {
    const warnings = await fetchWeatherWarnings();
    return NextResponse.json(warnings);
  } catch (error) {
    console.error("Error fetching weather warnings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
