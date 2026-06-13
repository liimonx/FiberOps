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
import type { Asset, Incident, TeamMember } from "@/types/domain";
import {
  createWorkOrderSchema,
  priorityLabels,
  workOrderPriorities,
  workOrderTypes,
  workTypeLabels,
  type CreateWorkOrderFormValues,
} from "@/modules/work-orders/schemas/workOrder.schema";
import { useCreateWorkOrder } from "@/modules/work-orders/hooks/useWorkOrdersData";

type CreateWorkOrderModalProps = {
  open: boolean;
  teamMembers: TeamMember[];
  incidents: Incident[];
  assets: Asset[];
  defaultIncidentId?: string;
  onClose: () => void;
  onCreated: (workOrderId: string) => void;
};

export function CreateWorkOrderModal({
  open,
  teamMembers,
  incidents,
  assets,
  defaultIncidentId,
  onClose,
  onCreated,
}: CreateWorkOrderModalProps) {
  const {
    mutateAsync,
    isPending,
    isError,
    error,
    reset: resetMutation,
  } = useCreateWorkOrder();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isValid },
  } = useForm<CreateWorkOrderFormValues>({
    resolver: zodResolver(createWorkOrderSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      priority: "medium",
      workType: "repair",
      assigneeId: "",
      relatedIncidentId: defaultIncidentId ?? "",
      relatedAssetId: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: "",
        priority: "medium",
        workType: "repair",
        assigneeId: "",
        relatedIncidentId: defaultIncidentId ?? "",
        relatedAssetId: "",
        notes: "",
      });
      resetMutation();
    }
  }, [open, defaultIncidentId, reset, resetMutation]);

  const onSubmit = async (values: CreateWorkOrderFormValues) => {
    const payload: CreateWorkOrderFormValues = {
      title: values.title,
      priority: values.priority,
      workType: values.workType,
      notes: values.notes,
      assigneeId: values.assigneeId || undefined,
      relatedIncidentId: values.relatedIncidentId || undefined,
      relatedAssetId: values.relatedAssetId || undefined,
    };

    const order = await mutateAsync(payload);
    onCreated(order.id);
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="New Work Order"
      subtitle="Create a field task and optionally link it to an incident or asset."
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
            iconName="Plus"
            disabled={!isValid || isPending}
            onClick={handleSubmit(onSubmit)}
          >
            {isPending ? "Creating..." : "Create Work Order"}
          </Button>
        </div>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="u-modal-form"
        noValidate
      >
        <div className="u-form-field">
          <label className="u-form-label" htmlFor="work-order-title">
            Title
          </label>
          <Input
            id="work-order-title"
            placeholder="Describe the field task..."
            fullWidth
            {...register("title")}
          />
          {errors.title && (
            <p className="u-form-error">{errors.title.message}</p>
          )}
        </div>

        <div className="u-form-field">
          <label className="u-form-label" htmlFor="work-order-priority">
            Priority
          </label>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <Select
                id="work-order-priority"
                value={field.value}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  field.onChange(event.target.value)
                }
                options={workOrderPriorities.map((priority) => ({
                  label: priorityLabels[priority],
                  value: priority,
                }))}
              />
            )}
          />
        </div>

        <div className="u-form-field">
          <label className="u-form-label" htmlFor="work-order-type">
            Work type
          </label>
          <Controller
            name="workType"
            control={control}
            render={({ field }) => (
              <Select
                id="work-order-type"
                value={field.value}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  field.onChange(event.target.value)
                }
                options={workOrderTypes.map((type) => ({
                  label: workTypeLabels[type],
                  value: type,
                }))}
              />
            )}
          />
        </div>

        <div className="u-form-field">
          <label className="u-form-label" htmlFor="work-order-assignee">
            Assignee
            <span className="u-text-secondary-emphasis u-font-normal"> (optional)</span>
          </label>
          <Controller
            name="assigneeId"
            control={control}
            render={({ field }) => (
              <Select
                id="work-order-assignee"
                value={field.value ?? ""}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  field.onChange(event.target.value)
                }
                options={[
                  { label: "Unassigned", value: "" },
                  ...teamMembers.map((member) => ({
                    label: member.name,
                    value: member.id,
                  })),
                ]}
              />
            )}
          />
        </div>

        <div className="u-form-field">
          <label className="u-form-label" htmlFor="work-order-incident">
            Related incident
            <span className="u-text-secondary-emphasis u-font-normal"> (optional)</span>
          </label>
          <Controller
            name="relatedIncidentId"
            control={control}
            render={({ field }) => (
              <Select
                id="work-order-incident"
                value={field.value ?? ""}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  field.onChange(event.target.value)
                }
                options={[
                  { label: "None", value: "" },
                  ...incidents.map((incident) => ({
                    label: `${incident.id} — ${incident.title}`,
                    value: incident.id,
                  })),
                ]}
              />
            )}
          />
        </div>

        <div className="u-form-field">
          <label className="u-form-label" htmlFor="work-order-asset">
            Related asset
            <span className="u-text-secondary-emphasis u-font-normal"> (optional)</span>
          </label>
          <Controller
            name="relatedAssetId"
            control={control}
            render={({ field }) => (
              <Select
                id="work-order-asset"
                value={field.value ?? ""}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  field.onChange(event.target.value)
                }
                options={[
                  { label: "None", value: "" },
                  ...assets.map((asset) => ({
                    label: `${asset.id} — ${asset.name}`,
                    value: asset.id,
                  })),
                ]}
              />
            )}
          />
        </div>

        <div className="u-form-field">
          <label className="u-form-label" htmlFor="work-order-notes">
            Notes
            <span className="u-text-secondary-emphasis u-font-normal"> (optional)</span>
          </label>
          <Textarea
            id="work-order-notes"
            rows={3}
            placeholder="Additional context for the field team..."
            fullWidth
            {...register("notes")}
          />
        </div>

        {isError && (
          <Callout variant="error" title="Failed to create work order">
            <p className="u-text-sm u-mb-0">
              {error instanceof Error ? error.message : "Please try again."}
            </p>
          </Callout>
        )}
      </form>
    </Modal>
  );
}
