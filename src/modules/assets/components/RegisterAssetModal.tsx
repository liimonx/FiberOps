"use client";

import { useEffect, type ChangeEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Callout, Input, Modal, Select } from "@shohojdhara/atomix";
import {
  assetKindLabels,
  assetKinds,
  assetStatuses,
  assetStatusLabels,
  createAssetSchema,
  type CreateAssetFormValues,
} from "@/modules/assets/schemas/asset.schema";
import { useCreateAsset } from "@/modules/assets/hooks/useAssetsData";
import type { Asset } from "@/types/domain";

type RegisterAssetModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (asset: Asset) => void;
};

const defaultLocation = {
  lat: 23.8103,
  lng: 90.4125,
};

export function RegisterAssetModal({
  open,
  onClose,
  onCreated,
}: RegisterAssetModalProps) {
  const {
    mutateAsync,
    isPending,
    isError,
    error,
    reset: resetMutation,
  } = useCreateAsset();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isValid },
  } = useForm<CreateAssetFormValues>({
    resolver: zodResolver(createAssetSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      kind: "pole",
      status: "active",
      location: defaultLocation,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: "",
        kind: "pole",
        status: "active",
        location: defaultLocation,
      });
      resetMutation();
    }
  }, [open, reset, resetMutation]);

  const onSubmit = async (values: CreateAssetFormValues) => {
    const asset = await mutateAsync(values);
    onCreated(asset);
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Register Asset"
      subtitle="Add a new infrastructure asset to the network inventory."
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
            {isPending ? "Registering..." : "Register Asset"}
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
          <label className="u-form-label" htmlFor="asset-name">
            Asset Name
          </label>
          <Input
            id="asset-name"
            placeholder="e.g. Road 12 Pole #3"
            fullWidth
            {...register("name")}
          />
          {errors.name && <p className="u-form-error">{errors.name.message}</p>}
        </div>

        <div className="u-form-field">
          <label className="u-form-label" htmlFor="asset-kind">
            Asset Type
          </label>
          <Controller
            name="kind"
            control={control}
            render={({ field }) => (
              <Select
                id="asset-kind"
                value={field.value}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  field.onChange(event.target.value)
                }
                options={assetKinds.map((kind) => ({
                  label: assetKindLabels[kind],
                  value: kind,
                }))}
              />
            )}
          />
        </div>

        <div className="u-form-field">
          <label className="u-form-label" htmlFor="asset-status">
            Initial Status
          </label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                id="asset-status"
                value={field.value}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  field.onChange(event.target.value)
                }
                options={assetStatuses.map((status) => ({
                  label: assetStatusLabels[status],
                  value: status,
                }))}
              />
            )}
          />
        </div>

        <div className="u-form-field">
          <span className="u-form-label">Coordinates</span>
          <div className="u-coords-grid">
            <div>
              <label className="u-text-sm u-text-secondary-emphasis" htmlFor="asset-lat">
                Latitude
              </label>
              <Input
                id="asset-lat"
                type="number"
                step="any"
                placeholder="23.8103"
                fullWidth
                {...register("location.lat", { valueAsNumber: true })}
              />
              {errors.location?.lat && (
                <p className="u-form-error">{errors.location.lat.message}</p>
              )}
            </div>
            <div>
              <label className="u-text-sm u-text-secondary-emphasis" htmlFor="asset-lng">
                Longitude
              </label>
              <Input
                id="asset-lng"
                type="number"
                step="any"
                placeholder="90.4125"
                fullWidth
                {...register("location.lng", { valueAsNumber: true })}
              />
              {errors.location?.lng && (
                <p className="u-form-error">{errors.location.lng.message}</p>
              )}
            </div>
          </div>
        </div>

        {isError && (
          <Callout variant="error" title="Failed to register asset">
            <p className="u-text-sm u-mb-0">
              {error instanceof Error ? error.message : "Please try again."}
            </p>
          </Callout>
        )}
      </form>
    </Modal>
  );
}
