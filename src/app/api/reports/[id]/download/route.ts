import { NextResponse } from "next/server";
import { getReportDownloadById } from "@/mocks/reportsData";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const download = getReportDownloadById(id);

  if (!download) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json(download);
}
