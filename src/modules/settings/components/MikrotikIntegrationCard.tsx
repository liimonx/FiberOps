"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge, Button, Callout, Card, Icon, Input, Select, Toggle } from "@shohojdhara/atomix";
import type { Integration } from "@/types/domain";
import {
  integrationUpdateSchema,
  validateIntegrationUpdate,
  type IntegrationUpdateFormValues,
} from "@/modules/settings/schemas/integrationsSettings.schema";
import { useIntegrationsSettings } from "@/modules/settings/hooks/useIntegrationsSettings";

const statusVariants: Record<
  Integration["status"],
  "success" | "info" | "error"
> = {
  connected: "success",
  disconnected: "info",
  error: "error",
};

const statusLabels: Record<Integration["status"], string> = {
  connected: "Connected",
  disconnected: "Disconnected",
  error: "Needs setup",
};

type MikrotikIntegrationCardProps = {
  integration: Integration;
  isSaving: boolean;
  isSuccess: boolean;
  saveError: Error | null;
  onSave: (values: IntegrationUpdateFormValues) => Promise<void>;
  onResetSaveState: () => void;
};

export function MikrotikIntegrationCard({
  integration,
  isSaving,
  isSuccess,
  saveError,
  onSave,
  onResetSaveState,
}: MikrotikIntegrationCardProps) {
  const { testMikrotikConnectionAsync, isTestingConnection, testConnectionResult, testConnectionError, resetTestConnectionState } =
    useIntegrationsSettings();

  const hasExistingCredentials = Boolean(integration.passwordMasked);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    setError,
    getValues,
    formState: { errors, isDirty },
  } = useForm<IntegrationUpdateFormValues>({
    resolver: zodResolver(integrationUpdateSchema),
    mode: "onChange",
    defaultValues: {
      enabled: integration.enabled,
      host: integration.host ?? "",
      port: integration.port ?? 443,
      username: integration.username ?? "",
      password: "",
      useSsl: integration.useSsl ?? true,
      verifySsl: integration.verifySsl ?? true,
      apiMode: integration.apiMode ?? "rest",
      monitoredInterface: integration.monitoredInterface ?? "",
    },
  });

  const enabled = useWatch({ control, name: "enabled" });
  const formValues = useWatch({ control });
  const [testMessage, setTestMessage] = useState<string | null>(null);

  useEffect(() => {
    reset({
      enabled: integration.enabled,
      host: integration.host ?? "",
      port: integration.port ?? 443,
      username: integration.username ?? "",
      password: "",
      useSsl: integration.useSsl ?? true,
      verifySsl: integration.verifySsl ?? true,
      apiMode: integration.apiMode ?? "rest",
      monitoredInterface: integration.monitoredInterface ?? "",
    });
  }, [integration, reset]);

  const validation = validateIntegrationUpdate(
    "mikrotik",
    {
      enabled: formValues?.enabled ?? integration.enabled,
      host: formValues?.host,
      port: formValues?.port,
      username: formValues?.username,
      password: formValues?.password,
      useSsl: formValues?.useSsl,
      verifySsl: formValues?.verifySsl,
      apiMode: formValues?.apiMode,
      monitoredInterface: formValues?.monitoredInterface,
    },
    hasExistingCredentials
  );

  const canSave = isDirty && validation.success && !isSaving;

  const onSubmit = async (values: IntegrationUpdateFormValues) => {
    const parsed = validateIntegrationUpdate("mikrotik", values, hasExistingCredentials);

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (typeof field === "string") {
          setError(field as keyof IntegrationUpdateFormValues, {
            message: issue.message,
          });
        }
      });
      return;
    }

    onResetSaveState();
    await onSave(parsed.data);
    reset({
      ...parsed.data,
      password: "",
    });
  };

  const handleTestConnection = async () => {
    resetTestConnectionState();
    setTestMessage(null);

    const values = getValues();
    try {
      const result = await testMikrotikConnectionAsync({
        host: values.host,
        port: values.port,
        username: values.username,
        password: values.password || undefined,
        useSsl: values.useSsl,
        verifySsl: values.verifySsl,
        apiMode: values.apiMode,
      });
      setTestMessage(
        result.ok
          ? `Connected to ${result.identity ?? "router"}`
          : result.message
      );
    } catch {
      setTestMessage(testConnectionError?.message ?? "Connection test failed");
    }
  };

  return (
    <Card className="u-h-100">
      <div className="u-flex u-flex-column u-gap-4">
        <div className="u-flex u-items-start u-justify-between u-gap-3">
          <div className="u-flex u-items-center u-gap-3">
            <div className="u-integration-icon">
              <Icon name="WifiHigh" size="md" />
            </div>
            <div>
              <h3 className="u-text-sm u-font-bold u-mb-1">{integration.name}</h3>
              <Badge
                variant={statusVariants[integration.status]}
                label={statusLabels[integration.status]}
              />
            </div>
          </div>

          <Toggle
            checked={enabled ?? integration.enabled}
            disabled={isSaving}
            onChange={(checked) =>
              setValue("enabled", checked, { shouldDirty: true, shouldValidate: true })
            }
            aria-label="Enable Mikrotik"
          />
        </div>

        <p className="u-text-xs u-text-secondary-emphasis u-mb-0">
          {integration.description}
        </p>

        {enabled && (
          <>
            <div>
              <label htmlFor="mikrotik-host" className="u-form-label">
                Router Host
              </label>
              <Input id="mikrotik-host" fullWidth placeholder="192.168.88.1" {...register("host")} />
              {errors.host && <p className="u-form-error">{errors.host.message}</p>}
            </div>

            <div className="u-flex u-gap-3">
              <div className="u-flex-1">
                <label htmlFor="mikrotik-port" className="u-form-label">
                  Port
                </label>
                <Input id="mikrotik-port" type="number" fullWidth {...register("port")} />
              </div>
              <div className="u-flex-1">
                <label htmlFor="mikrotik-api-mode" className="u-form-label">
                  API Mode
                </label>
                <Select
                  id="mikrotik-api-mode"
                  fullWidth
                  value={formValues?.apiMode ?? "rest"}
                  onChange={(event) =>
                    setValue("apiMode", event.target.value as "rest" | "classic", {
                      shouldDirty: true,
                    })
                  }
                  options={[
                    { value: "rest", label: "REST (RouterOS 7+)" },
                    { value: "classic", label: "Classic API (8728)" },
                  ]}
                />
              </div>
            </div>

            <div>
              <label htmlFor="mikrotik-username" className="u-form-label">
                API Username
              </label>
              <Input id="mikrotik-username" fullWidth autoComplete="off" {...register("username")} />
              {errors.username && <p className="u-form-error">{errors.username.message}</p>}
            </div>

            <div>
              <label htmlFor="mikrotik-password" className="u-form-label">
                API Password
              </label>
              <Input
                id="mikrotik-password"
                type="password"
                fullWidth
                autoComplete="off"
                {...register("password")}
              />
              {hasExistingCredentials && (
                <p className="u-form-help u-mt-1">
                  Current: {integration.passwordMasked} — leave blank to keep
                </p>
              )}
              {errors.password && <p className="u-form-error">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="mikrotik-interface" className="u-form-label">
                Monitored Interface
              </label>
              <Input
                id="mikrotik-interface"
                fullWidth
                placeholder="ether1"
                {...register("monitoredInterface")}
              />
              <p className="u-form-help u-mt-1">
                Optional. Used for dashboard bandwidth charts.
              </p>
            </div>

            <div className="u-flex u-gap-4">
              <Toggle
                checked={formValues?.useSsl ?? true}
                onChange={(checked) => setValue("useSsl", checked, { shouldDirty: true })}
                aria-label="Use SSL"
              />
              <span className="u-text-xs">Use SSL</span>
            </div>
          </>
        )}

        {(testMessage || testConnectionResult) && (
          <Callout
            variant={testConnectionResult?.ok ? "success" : "error"}
            title={testConnectionResult?.ok ? "Connection OK" : "Connection failed"}
          >
            <p className="u-form-help">{testMessage ?? testConnectionResult?.message}</p>
          </Callout>
        )}

        {isSuccess && (
          <Callout variant="success" title="Saved" icon={<Icon name="CheckCircle" />}>
            <p className="u-form-help">Mikrotik settings were updated.</p>
          </Callout>
        )}

        {saveError && (
          <Callout variant="error" title="Save failed">
            <p className="u-form-help">{saveError.message}</p>
          </Callout>
        )}

        <div className="u-flex u-gap-2 u-mt-auto">
          <Button
            type="button"
            variant="outline-primary"
            size="sm"
            disabled={!canSave}
            loading={isSaving}
            onClick={handleSubmit(onSubmit)}
          >
            Save
          </Button>
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            disabled={isTestingConnection}
            loading={isTestingConnection}
            onClick={handleTestConnection}
          >
            Test connection
          </Button>
        </div>
      </div>
    </Card>
  );
}
