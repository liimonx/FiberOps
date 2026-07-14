"use client";

import { useEffect, useState } from "react";
import { Callout, Icon } from "@shohojdhara/atomix";

type IncidentAlertDetail = {
  title?: string;
  message?: string;
  severity?: string;
  nodeId?: string;
};

export function IncidentAlertToaster() {
  const [alert, setAlert] = useState<IncidentAlertDetail | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<IncidentAlertDetail>;
      setAlert(custom.detail ?? { message: "New incident alert" });
    };
    window.addEventListener("fiberops:incident-alert", handler);
    return () => window.removeEventListener("fiberops:incident-alert", handler);
  }, []);

  useEffect(() => {
    if (!alert) return;
    const timeout = window.setTimeout(() => setAlert(null), 8000);
    return () => window.clearTimeout(timeout);
  }, [alert]);

  if (!alert) return null;

  return (
    <div
      className="u-fixed"
      style={{ right: 16, bottom: 16, zIndex: 60, maxWidth: 360 }}
      role="status"
      aria-live="polite"
    >
      <Callout
        variant="warning"
        title="Incident alert"
        icon={<Icon name="Warning" />}
      >
        <p className="u-text-sm u-mb-0">
          {alert.title || alert.message || "A new network incident was reported."}
        </p>
      </Callout>
    </div>
  );
}
