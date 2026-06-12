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
  createProposalSchema,
  typeLabels,
  type CreateProposalFormValues,
} from "@/modules/planning/schemas/proposal.schema";
import { useCreatePlanningProposal } from "@/modules/planning/hooks/usePlanningProposalsData";

type CreateProposalModalProps = {
  open: boolean;
  assets: Asset[];
  onClose: () => void;
  onCreated: (proposalId: string) => void;
};

const ownerOptions = [
  "Jordan Lee",
  "Sam Rivera",
  "Taylor Chen",
  "Alex Morgan",
];

export function CreateProposalModal({
  open,
  assets,
  onClose,
  onCreated,
}: CreateProposalModalProps) {
  const {
    mutateAsync,
    isPending,
    isError,
    error,
    reset: resetMutation,
  } = useCreatePlanningProposal();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isValid },
  } = useForm<CreateProposalFormValues>({
    resolver: zodResolver(createProposalSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      type: "fiber_expansion",
      targetArea: "",
      relatedAssetId: "",
      estimatedNewCustomers: 0,
      projectedUtilizationPercent: 50,
      estimatedBudgetUsd: 0,
      owner: ownerOptions[0],
      targetStartDate: "",
      targetCompletionDate: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: "",
        description: "",
        type: "fiber_expansion",
        targetArea: "",
        relatedAssetId: "",
        estimatedNewCustomers: 0,
        projectedUtilizationPercent: 50,
        estimatedBudgetUsd: 0,
        owner: ownerOptions[0],
        targetStartDate: "",
        targetCompletionDate: "",
        notes: "",
      });
      resetMutation();
    }
  }, [open, reset, resetMutation]);

  const onSubmit = async (values: CreateProposalFormValues) => {
    const proposal = await mutateAsync({
      ...values,
      relatedAssetId: values.relatedAssetId || undefined,
      targetStartDate: values.targetStartDate || undefined,
      targetCompletionDate: values.targetCompletionDate || undefined,
      description: values.description || undefined,
      notes: values.notes || undefined,
    });
    onCreated(proposal.id);
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Create Proposal"
      subtitle="Define expansion scope, forecast, and budget. Draw geometry on the map after creation."
      size="lg"
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
            {isPending ? "Creating..." : "Create Proposal"}
          </Button>
        </div>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="u-form-column"
        noValidate
      >
        <div className="u-incidents-form-field">
          <label className="u-form-label" htmlFor="proposal-title">
            Title
          </label>
          <Input
            id="proposal-title"
            placeholder="e.g. Gulshan North Fiber Expansion"
            fullWidth
            {...register("title")}
          />
          {errors.title && <p className="u-form-error">{errors.title.message}</p>}
        </div>

        <div className="u-incidents-form-field">
          <label className="u-form-label" htmlFor="proposal-description">
            Description
          </label>
          <Textarea
            id="proposal-description"
            placeholder="Brief summary of the expansion plan..."
            rows={3}
            fullWidth
            {...register("description")}
          />
        </div>

        <div className="u-incidents-form-field">
          <label className="u-form-label" htmlFor="proposal-type">
            Proposal type
          </label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                id="proposal-type"
                value={field.value}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  field.onChange(event.target.value)
                }
                options={Object.entries(typeLabels).map(([value, label]) => ({
                  label,
                  value,
                }))}
              />
            )}
          />
        </div>

        <div className="u-incidents-form-field">
          <label className="u-form-label" htmlFor="proposal-target-area">
            Target area
          </label>
          <Input
            id="proposal-target-area"
            placeholder="e.g. Gulshan North"
            fullWidth
            {...register("targetArea")}
          />
          {errors.targetArea && (
            <p className="u-form-error">{errors.targetArea.message}</p>
          )}
        </div>

        <div className="u-incidents-form-field">
          <label className="u-form-label" htmlFor="proposal-asset">
            Related asset
            <span className="u-text-secondary-emphasis u-font-normal"> (optional)</span>
          </label>
          <Controller
            name="relatedAssetId"
            control={control}
            render={({ field }) => (
              <Select
                id="proposal-asset"
                value={field.value ?? ""}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  field.onChange(event.target.value)
                }
                options={[
                  { label: "None", value: "" },
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
          <label className="u-form-label" htmlFor="proposal-customers">
            Estimated new customers
          </label>
          <Input
            id="proposal-customers"
            type="number"
            min={0}
            fullWidth
            {...register("estimatedNewCustomers", { valueAsNumber: true })}
          />
          {errors.estimatedNewCustomers && (
            <p className="u-form-error">{errors.estimatedNewCustomers.message}</p>
          )}
        </div>

        <div className="u-flex u-gap-4">
          <div className="u-incidents-form-field u-flex-1">
            <label className="u-form-label" htmlFor="proposal-current-util">
              Current utilization %
            </label>
            <Input
              id="proposal-current-util"
              type="number"
              min={0}
              max={100}
              fullWidth
              {...register("currentUtilizationPercent", { valueAsNumber: true })}
            />
          </div>
          <div className="u-incidents-form-field u-flex-1">
            <label className="u-form-label" htmlFor="proposal-projected-util">
              Projected utilization %
            </label>
            <Input
              id="proposal-projected-util"
              type="number"
              min={0}
              max={100}
              fullWidth
              {...register("projectedUtilizationPercent", { valueAsNumber: true })}
            />
            {errors.projectedUtilizationPercent && (
              <p className="u-form-error">
                {errors.projectedUtilizationPercent.message}
              </p>
            )}
          </div>
        </div>

        <div className="u-incidents-form-field">
          <label className="u-form-label" htmlFor="proposal-budget">
            Estimated budget (USD)
          </label>
          <Input
            id="proposal-budget"
            type="number"
            min={0}
            fullWidth
            {...register("estimatedBudgetUsd", { valueAsNumber: true })}
          />
          {errors.estimatedBudgetUsd && (
            <p className="u-form-error">{errors.estimatedBudgetUsd.message}</p>
          )}
        </div>

        <div className="u-incidents-form-field">
          <label className="u-form-label" htmlFor="proposal-owner">
            Owner
          </label>
          <Controller
            name="owner"
            control={control}
            render={({ field }) => (
              <Select
                id="proposal-owner"
                value={field.value}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  field.onChange(event.target.value)
                }
                options={ownerOptions.map((name) => ({ label: name, value: name }))}
              />
            )}
          />
        </div>

        <div className="u-flex u-gap-4">
          <div className="u-incidents-form-field u-flex-1">
            <label className="u-form-label" htmlFor="proposal-start">
              Target start date
            </label>
            <Input id="proposal-start" type="date" fullWidth {...register("targetStartDate")} />
          </div>
          <div className="u-incidents-form-field u-flex-1">
            <label className="u-form-label" htmlFor="proposal-end">
              Target completion date
            </label>
            <Input
              id="proposal-end"
              type="date"
              fullWidth
              {...register("targetCompletionDate")}
            />
          </div>
        </div>

        <div className="u-incidents-form-field">
          <label className="u-form-label" htmlFor="proposal-notes">
            Notes
          </label>
          <Textarea
            id="proposal-notes"
            placeholder="Additional context..."
            rows={2}
            fullWidth
            {...register("notes")}
          />
        </div>

        {isError && (
          <Callout variant="error" title="Failed to create proposal">
            <p className="u-text-sm u-mb-0">
              {error instanceof Error ? error.message : "Please try again."}
            </p>
          </Callout>
        )}
      </form>
    </Modal>
  );
}
