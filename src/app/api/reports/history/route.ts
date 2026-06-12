import { NextResponse } from "next/server";
import { getReportHistory } from "@/mocks/reportsData";

export async function GET() {
  return NextResponse.json({ items: getReportHistory() });
}
