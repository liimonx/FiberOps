import { NextResponse } from "next/server";
import { getUptimeSummary } from "@/mocks/reportsData";

export async function GET(request: Request) {
  const period = new URL(request.url).searchParams.get("period") ?? "6m";
  return NextResponse.json(getUptimeSummary(period));
}
