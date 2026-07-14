"use client";

import { useEffect, type ChangeEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Callout, Input, Modal, Select } from "@shohojdhara/atomix";
import type { Asset } from "@/types/domain";
import {
  createCustomerSchema,
  customerPlans,
  statusLabels,
  type CreateCustomerFormValues,
} from "@/modules/customers/schemas/customer.schema";
import { useCreateCustomer } from "@/modules/customers/hooks/useCustomersData";

type AddCustomerModalProps = {
  open: boolean;
  assets: Asset[];
  onClose: () => void;
  onCreated: (customerId: string) => void;
};

export function AddCustomerModal({
  open,
  assets,
  onClose,
  onCreated,
}: AddCustomerModalProps) {
  const {
    mutateAsync,
    isPending,
    isError,
    error,
    reset: resetMutation,
  } = useCreateCustomer();

  const onuAssets = assets.filter((asset) => asset.kind === "onu");

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isValid },
  } = useForm<CreateCustomerFormValues>({
    resolver: zodResolver(createCustomerSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      plan: "Fiber 100Mbps",
      status: "online",
      email: "",
      pppoeUsername: "",
      relatedOnuId: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: "",
        plan: "Fiber 100Mbps",
        status: "online",
        email: "",
        pppoeUsername: "",
        relatedOnuId: "",
      });
      resetMutation();
    }
  }, [open, reset, resetMutation]);

  const onSubmit = async (values: CreateCustomerFormValues) => {
    const onu = values.relatedOnuId
      ? onuAssets.find((asset) => asset.id === values.relatedOnuId)
      : undefined;

    const payload: CreateCustomerFormValues = {
      name: values.name,
      plan: values.plan,
      status: values.status,
      email: values.email,
      pppoeUsername: values.pppoeUsername || undefined,
      relatedOnuId: values.relatedOnuId || undefined,
      location: onu?.location,
    };

    const customer = await mutateAsync(payload);
    onCreated(customer.id);
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Add Customer"
      subtitle="Register a new customer profile and link their ONU."
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
            {isPending ? "Adding..." : "Add Customer"}
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
          <label className="u-form-label" htmlFor="customer-name">
            Customer Name
          </label>
          <Input
            id="customer-name"
            placeholder="Business or residence name..."
            fullWidth
            {...register("name")}
          />
          {errors.name && <p className="u-form-error">{errors.name.message}</p>}
        </div>

        <div className="u-form-field">
          <label className="u-form-label" htmlFor="customer-plan">
            Service Plan
          </label>
          <Controller
            name="plan"
            control={control}
            render={({ field }) => (
              <Select
                id="customer-plan"
                value={field.value}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  field.onChange(event.target.value)
                }
                options={customerPlans.map((plan) => ({
                  label: plan,
                  value: plan,
                }))}
              />
            )}
          />
        </div>

        <div className="u-form-field">
          <label className="u-form-label" htmlFor="customer-status-create">
            Initial Status
          </label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                id="customer-status-create"
                value={field.value}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  field.onChange(event.target.value)
                }
                options={[
                  { label: statusLabels.online, value: "online" },
                  { label: statusLabels.unstable, value: "unstable" },
                  { label: statusLabels.offline, value: "offline" },
                ]}
              />
            )}
          />
        </div>

        <div className="u-form-field">
          <label className="u-form-label" htmlFor="customer-email">
            Email
            <span className="u-text-secondary-emphasis u-font-normal"> (optional)</span>
          </label>
          <Input
            id="customer-email"
            type="email"
            placeholder="billing@example.com"
            fullWidth
            {...register("email")}
          />
          {errors.email && <p className="u-form-error">{errors.email.message}</p>}
        </div>

        <div className="u-form-field">
          <label className="u-form-label" htmlFor="customer-pppoe">
            PPPoE username
            <span className="u-text-secondary-emphasis u-font-normal"> (optional)</span>
          </label>
          <Input
            id="customer-pppoe"
            placeholder="user@fiberops"
            fullWidth
            {...register("pppoeUsername")}
          />
          {errors.pppoeUsername && (
            <p className="u-form-error">{errors.pppoeUsername.message}</p>
          )}
        </div>

        <div className="u-form-field">
          <label className="u-form-label" htmlFor="customer-onu">
            Linked ONU
            <span className="u-text-secondary-emphasis u-font-normal"> (optional)</span>
          </label>
          <Controller
            name="relatedOnuId"
            control={control}
            render={({ field }) => (
              <Select
                id="customer-onu"
                value={field.value ?? ""}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  field.onChange(event.target.value)
                }
                options={[
                  { label: "No ONU selected", value: "" },
                  ...onuAssets.map((asset) => ({
                    label: `${asset.name} (${asset.id})`,
                    value: asset.id,
                  })),
                ]}
              />
            )}
          />
        </div>

        {isError && (
          <Callout variant="error" title="Failed to add customer">
            <p className="u-text-sm u-mb-0">
              {error instanceof Error ? error.message : "Please try again."}
            </p>
          </Callout>
        )}
      </form>
    </Modal>
  );
}
