import { NextResponse } from "next/server";
import { getIncidentAnalytics } from "@/mocks/reportsData";

export async function GET(request: Request) {
  const period = new URL(request.url).searchParams.get("period") ?? "30d";
  return NextResponse.json(getIncidentAnalytics(period));
}
