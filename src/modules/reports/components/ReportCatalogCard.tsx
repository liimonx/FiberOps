"use client";

import { Button, Card, Icon } from "@shohojdhara/atomix";
import type { ReportType } from "@/types/domain";
import { reportTypeLabels } from "@/modules/reports/schemas/report.schema";

type ReportCatalogCardProps = {
  type: ReportType;
  description: string;
  iconName: "FilePdf" | "FileCsv" | "ChartBar";
  iconClassName?: string;
  onGenerate: (type: ReportType) => void;
};

export function ReportCatalogCard({
  type,
  description,
  iconName,
  iconClassName,
  onGenerate,
}: ReportCatalogCardProps) {
  return (
    <Card className="u-h-100 u-flex u-flex-column">
      <Icon name={iconName} size="xl" className={`u-mb-4 ${iconClassName ?? ""}`} />
      <h3 className="u-font-bold u-text-lg u-mb-2">{reportTypeLabels[type]}</h3>
      <p className="u-text-secondary-emphasis u-text-sm u-flex-1">{description}</p>
      <Button
        variant="outline-secondary"
        className="u-mt-4 u-w-100"
        onClick={() => onGenerate(type)}
      >
        Generate
      </Button>
    </Card>
  );
}
