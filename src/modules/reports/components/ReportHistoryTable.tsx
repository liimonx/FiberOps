"use client";

import { Badge, Button, DataTable, DataTableColumn } from "@shohojdhara/atomix";
import type { GeneratedReport } from "@/types/domain";
import {
  reportFormatLabels,
  reportPeriodLabels,
  reportTypeLabels,
} from "@/modules/reports/schemas/report.schema";
import { useDownloadReport } from "@/modules/reports/hooks/useReportsData";
import { triggerReportDownload } from "@/modules/reports/lib/buildReportExports";

type ReportHistoryTableProps = {
  reports: GeneratedReport[];
  downloadingId?: string | null;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ReportHistoryTable({ reports }: ReportHistoryTableProps) {
  const { mutateAsync: downloadReport, isPending, variables } = useDownloadReport();

  const columns: DataTableColumn[] = [
    {
      key: "title",
      title: "Report",
      render: (val) => <span className="u-font-bold">{val}</span>,
    },
    {
      key: "type",
      title: "Type",
      render: (_, row: GeneratedReport) => reportTypeLabels[row.type],
    },
    {
      key: "period",
      title: "Period",
      render: (_, row: GeneratedReport) => reportPeriodLabels[row.period],
    },
    {
      key: "format",
      title: "Format",
      render: (_, row: GeneratedReport) => (
        <Badge variant="secondary" label={reportFormatLabels[row.format]} />
      ),
    },
    {
      key: "generatedAt",
      title: "Generated",
      render: (val) => (
        <span className="u-text-secondary-emphasis u-text-sm">{formatDate(val)}</span>
      ),
    },
    {
      key: "generatedBy",
      title: "By",
    },
    {
      key: "fileSizeBytes",
      title: "Size",
      render: (val) => (
        <span className="u-text-sm u-font-mono">{formatFileSize(val)}</span>
      ),
    },
    {
      key: "actions",
      title: "",
      render: (_, row: GeneratedReport) => (
        <Button
          variant="outline-secondary"
          size="sm"
          loading={isPending && variables === row.id}
          onClick={async () => {
            const payload = await downloadReport(row.id);
            triggerReportDownload(payload);
          }}
        >
          Download
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={reports}
      rowKey="id"
      striped
      emptyMessage="No reports generated yet. Use the catalog above to create your first export."
    />
  );
}
