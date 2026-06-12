"use client";

import { useEffect, type ChangeEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Callout, Modal, Select } from "@shohojdhara/atomix";
import {
  defaultFormatsByType,
  generateReportSchema,
  reportFormatLabels,
  reportPeriodLabels,
  reportTypeLabels,
  type GenerateReportFormValues,
} from "@/modules/reports/schemas/report.schema";
import { useGenerateReport } from "@/modules/reports/hooks/useReportsData";
import { triggerReportDownload } from "@/modules/reports/lib/buildReportExports";
import type { ReportType } from "@/types/domain";

type GenerateReportModalProps = {
  open: boolean;
  reportType: ReportType | null;
  onClose: () => void;
  onGenerated?: () => void;
};

export function GenerateReportModal({
  open,
  reportType,
  onClose,
  onGenerated,
}: GenerateReportModalProps) {
  const {
    mutateAsync,
    isPending,
    isError,
    error,
    reset: resetMutation,
  } = useGenerateReport();

  const {
    handleSubmit,
    reset,
    control,
    register,
    watch,
    formState: { isValid },
  } = useForm<GenerateReportFormValues>({
    resolver: zodResolver(generateReportSchema),
    mode: "onChange",
    defaultValues: {
      type: "uptime_summary",
      format: "pdf",
      period: "30d",
    },
  });

  const selectedType = watch("type");

  useEffect(() => {
    if (!open || !reportType) return;
    reset({
      type: reportType,
      format: defaultFormatsByType[reportType],
      period: reportType === "uptime_summary" ? "6m" : "30d",
    });
    resetMutation();
  }, [open, reportType, reset, resetMutation]);

  const onSubmit = async (values: GenerateReportFormValues) => {
    const result = await mutateAsync(values);
    triggerReportDownload(result.download);
    onGenerated?.();
    onClose();
  };

  if (!reportType) return null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={`Generate ${reportTypeLabels[reportType]}`}
      subtitle="Choose a time period and export format."
      size="md"
      closeButton
      backdrop
      keyboard
      footer={
        <div className="u-flex u-justify-end u-gap-3 u-w-100">
          <Button variant="outline-secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="button"
            disabled={!isValid || isPending}
            loading={isPending}
            onClick={handleSubmit(onSubmit)}
          >
            Generate & Download
          </Button>
        </div>
      }
    >
      <form className="u-incidents-modal-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <input type="hidden" {...register("type")} />
        {isError && (
          <Callout variant="error" title="Generation failed">
            <p className="u-text-sm u-mb-0">
              {error instanceof Error ? error.message : "Could not generate report."}
            </p>
          </Callout>
        )}

        <div className="u-incidents-form-field">
          <label className="u-incidents-filter-label" htmlFor="report-period">
            Time period
          </label>
          <Controller
            name="period"
            control={control}
            render={({ field }) => (
              <Select
                id="report-period"
                value={field.value}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  field.onChange(event.target.value)
                }
                options={Object.entries(reportPeriodLabels).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            )}
          />
        </div>

        <div className="u-incidents-form-field">
          <label className="u-incidents-filter-label" htmlFor="report-format">
            Export format
          </label>
          <Controller
            name="format"
            control={control}
            render={({ field }) => (
              <Select
                id="report-format"
                value={field.value}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  field.onChange(event.target.value)
                }
                options={Object.entries(reportFormatLabels).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            )}
          />
        </div>

        {selectedType === "uptime_summary" && watch("format") === "pdf" && (
          <Callout variant="secondary" title="PDF export">
            <p className="u-text-sm u-mb-0">
              Downloads a print-ready HTML report. Open it in your browser and use
              Print to PDF.
            </p>
          </Callout>
        )}
      </form>
    </Modal>
  );
}
