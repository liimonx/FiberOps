import { NextResponse } from "next/server";
import { generateReport } from "@/mocks/reportsData";
import { generateReportSchema } from "@/modules/reports/schemas/report.schema";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = generateReportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  return NextResponse.json(generateReport(parsed.data));
}
