"use client";

import { useEffect, type ChangeEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Callout,
  Input,
  Modal,
  Select,
  Textarea,
} from "@shohojdhara/atomix";
import type { Asset } from "@/types/domain";
import {
  createIncidentSchema,
  severityLabels,
  type CreateIncidentFormValues,
} from "@/modules/incidents/schemas/incident.schema";
import { useCreateIncident } from "@/modules/incidents/hooks/useIncidentsData";

type ReportIncidentModalProps = {
  open: boolean;
  assets: Asset[];
  onClose: () => void;
  onCreated: (incidentId: string) => void;
};

export function ReportIncidentModal({
  open,
  assets,
  onClose,
  onCreated,
}: ReportIncidentModalProps) {
  const {
    mutateAsync,
    isPending,
    isError,
    error,
    reset: resetMutation,
  } = useCreateIncident();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isValid },
  } = useForm<CreateIncidentFormValues>({
    resolver: zodResolver(createIncidentSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      severity: "medium",
      relatedAssetId: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: "",
        severity: "medium",
        relatedAssetId: "",
        notes: "",
      });
      resetMutation();
    }
  }, [open, reset, resetMutation]);

  const onSubmit = async (values: CreateIncidentFormValues) => {
    const payload: CreateIncidentFormValues = {
      title: values.title,
      severity: values.severity,
      notes: values.notes,
      relatedAssetId: values.relatedAssetId || undefined,
    };

    const incident = await mutateAsync(payload);
    onCreated(incident.id);
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Report Incident"
      subtitle="Log a new network issue and dispatch the field team."
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
            variant="error"
            type="button"
            iconName="Warning"
            disabled={!isValid || isPending}
            onClick={handleSubmit(onSubmit)}
          >
            {isPending ? "Reporting..." : "Report Incident"}
          </Button>
        </div>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="u-incidents-modal-form"
        noValidate
      >
        <div className="u-incidents-form-field">
          <label className="u-form-label" htmlFor="incident-title">
            Issue Description
          </label>
          <Input
            id="incident-title"
            placeholder="Describe the network issue..."
            fullWidth
            {...register("title")}
          />
          {errors.title && (
            <p className="u-form-error">{errors.title.message}</p>
          )}
        </div>

        <div className="u-incidents-form-field">
          <label className="u-form-label" htmlFor="incident-severity">
            Severity
          </label>
          <Controller
            name="severity"
            control={control}
            render={({ field }) => (
              <Select
                id="incident-severity"
                value={field.value}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  field.onChange(event.target.value)
                }
                options={[
                  { label: severityLabels.low, value: "low" },
                  { label: severityLabels.medium, value: "medium" },
                  { label: severityLabels.high, value: "high" },
                  { label: severityLabels.critical, value: "critical" },
                ]}
              />
            )}
          />
        </div>

        <div className="u-incidents-form-field">
          <label className="u-form-label" htmlFor="incident-asset">
            Related Asset
            <span className="u-text-secondary-emphasis u-font-normal"> (optional)</span>
          </label>
          <Controller
            name="relatedAssetId"
            control={control}
            render={({ field }) => (
              <Select
                id="incident-asset"
                value={field.value ?? ""}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  field.onChange(event.target.value)
                }
                options={[
                  { label: "No asset selected", value: "" },
                  ...assets.map((asset) => ({
                    label: `${asset.name} (${asset.id})`,
                    value: asset.id,
                  })),
                ]}
              />
            )}
          />
        </div>

        <div className="u-incidents-form-field">
          <label className="u-form-label" htmlFor="incident-notes">
            Initial Notes
            <span className="u-text-secondary-emphasis u-font-normal"> (optional)</span>
          </label>
          <Textarea
            id="incident-notes"
            rows={3}
            placeholder="Add context for the dispatch team..."
            fullWidth
            {...register("notes")}
          />
        </div>

        {isError && (
          <Callout variant="error" title="Failed to report incident">
            <p className="u-text-sm u-mb-0">
              {error instanceof Error ? error.message : "Please try again."}
            </p>
          </Callout>
        )}
      </form>
    </Modal>
  );
}
