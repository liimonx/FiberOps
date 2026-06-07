"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Callout, Icon, Input } from "@shohojdhara/atomix";
import {
  organizationSettingsSchema,
  type OrganizationSettingsFormValues,
} from "@/modules/settings/schemas/organizationSettings.schema";
import { useOrganizationSettings } from "@/modules/settings/hooks/useOrganizationSettings";

export function GeneralSettingsForm() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    updateSettingsAsync,
    isSaving,
    isSuccess,
    saveError,
    resetSaveState,
  } = useOrganizationSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid },
  } = useForm<OrganizationSettingsFormValues>({
    resolver: zodResolver(organizationSettingsSchema),
    mode: "onChange",
    defaultValues: {
      organizationName: "",
      supportEmail: "",
    },
  });

  useEffect(() => {
    if (data) {
      reset(data);
      resetSaveState();
    }
  }, [data, reset, resetSaveState]);

  const onSubmit = async (values: OrganizationSettingsFormValues) => {
    resetSaveState();
    await updateSettingsAsync(values);
    reset(values);
  };

  if (isLoading) {
    return (
      <div className="u-form-column" aria-busy="true">
        <div className="u-skeleton u-h-14" />
        <div className="u-skeleton u-h-14" />
      </div>
    );
  }

  if (isError) {
    return (
      <Callout variant="error" title="Failed to load settings">
        <p className="u-text-sm u-mb-3">
          Organization settings could not be loaded. Please try again.
        </p>
        <Button variant="outline-secondary" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </Callout>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="u-form-column"
      noValidate
    >
      {isSuccess && (
        <Callout
          variant="success"
          title="Settings saved"
          icon={<Icon name="CheckCircle" />}
        >
          <p className="u-form-help">
            Organization settings were updated successfully.
          </p>
        </Callout>
      )}

      {saveError && (
        <Callout variant="error" title="Save failed">
          <p className="u-form-help">
            {saveError.message || "Unable to save organization settings."}
          </p>
        </Callout>
      )}

      <div>
        <label
          htmlFor="organizationName"
          className="u-form-label"
        >
          Organization Name
        </label>
        <Input
          id="organizationName"
          fullWidth
          {...register("organizationName")}
        />
        {errors.organizationName && (
          <p className="u-form-error">
            {errors.organizationName.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="supportEmail" className="u-form-label">
          Support Email
        </label>
        <Input
          id="supportEmail"
          type="email"
          fullWidth
          {...register("supportEmail")}
        />
        {errors.supportEmail && (
          <p className="u-form-error">{errors.supportEmail.message}</p>
        )}
      </div>

      <div className="u-mt-4">
        <Button
          type="submit"
          variant="primary"
          disabled={!isDirty || !isValid || isSaving}
          loading={isSaving}
        >
          Save Changes
        </Button>
      </div>
    </form>
  );
}
