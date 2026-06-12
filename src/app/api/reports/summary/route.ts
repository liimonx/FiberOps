import { NextResponse } from "next/server";
import { getReportsSummary } from "@/mocks/reportsData";

export async function GET() {
  return NextResponse.json(getReportsSummary());
}
