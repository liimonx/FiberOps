import { bypass, delay, http, HttpResponse, ws } from "msw";
import { createAsset, getAssets } from "@/mocks/assetsData";
import {
  createCustomer,
  getCustomerById,
  getCustomers,
  updateCustomer,
} from "@/mocks/customersData";
import {
  createIncident,
  getIncidentById,
  getIncidents,
  resolveIncident,
  updateIncident,
} from "@/mocks/incidentsData";
import {
  createPlanningProposal,
  getPlanningProposalById,
  getPlanningProposals,
  updatePlanningProposal,
} from "@/mocks/planningProposalsData";
import {
  createWorkOrder,
  getWorkOrderById,
  getWorkOrders,
  updateWorkOrder,
} from "@/mocks/workOrdersData";
import {
  generateReport,
  getIncidentAnalytics,
  getReportDownloadById,
  getReportHistory,
  getReportsSummary,
  getUptimeSummary,
} from "@/mocks/reportsData";
import { generateReportSchema } from "@/modules/reports/schemas/report.schema";
import {
  createIncidentSchema,
  resolveIncidentSchema,
  updateIncidentSchema,
} from "@/modules/incidents/schemas/incident.schema";
import {
  createProposalSchema,
  updateProposalSchema,
} from "@/modules/planning/schemas/proposal.schema";
import {
  createWorkOrderSchema,
  updateWorkOrderSchema,
} from "@/modules/work-orders/schemas/workOrder.schema";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "@/modules/customers/schemas/customer.schema";
import { createAssetSchema } from "@/modules/assets/schemas/asset.schema";
import {
  getOrganizationSettings,
  setOrganizationSettings,
} from "@/mocks/settingsData";
import {
  getIntegrationsSettings,
  integrationHasExistingCredentials,
  updateIntegration,
  updateOutboundWebhook,
  webhookHasExistingSecret,
} from "@/mocks/integrationsData";
import {
  getBillingSettingsPayload,
  setBillingSettings,
  syncBillingWithStripe,
} from "@/mocks/billingData";
import {
  createTeamInvite,
  getTeamSettings,
  revokeTeamInvite,
  updateTeamMemberRole,
} from "@/mocks/teamData";
import { billingSettingsSchema } from "@/modules/settings/schemas/billingSettings.schema";
import type { BillingSettingsFormValues } from "@/modules/settings/schemas/billingSettings.schema";
import { organizationSettingsSchema } from "@/modules/settings/schemas/organizationSettings.schema";
import {
  teamInviteSchema,
  teamMemberUpdateSchema,
} from "@/modules/settings/schemas/teamSettings.schema";
import type {
  TeamInviteFormValues,
  TeamMemberUpdateFormValues,
} from "@/modules/settings/schemas/teamSettings.schema";
import {
  validateIntegrationUpdate,
  validateOutboundWebhook,
} from "@/modules/settings/schemas/integrationsSettings.schema";
import type { IntegrationProviderId } from "@/types/domain";
import type {
  IntegrationUpdateFormValues,
  OutboundWebhookFormValues,
} from "@/modules/settings/schemas/integrationsSettings.schema";
import { createLogger } from "@/lib/logger";

const log = createLogger("MSW");

const chat = ws.link("ws://localhost:8080/ws");

export const handlers = [
  // WebSocket Mocking
  chat.addEventListener("connection", ({ client }) => {
    log.info("WebSocket connected:", client.id);

    // Send initial heartbeat
    client.send(
      JSON.stringify({
        type: "heartbeat",
        data: {
          serverTime: new Date().toISOString(),
          connectedClients: 1,
        },
      })
    );

    // Simulate random node updates every 10 seconds
    const interval = setInterval(() => {
      const assetList = getAssets();
      const randomNode = assetList[Math.floor(Math.random() * assetList.length)];
      if (!randomNode) return;

      const statuses = ["active", "degraded", "down", "maintenance"];
      const newStatus = statuses[Math.floor(Math.random() * statuses.length)];

      client.send(
        JSON.stringify({
          type: "status_broadcast",
          data: {
            nodeId: randomNode.id,
            status: newStatus,
            timestamp: new Date().toISOString(),
          },
        })
      );
    }, 10000);

    client.addEventListener("close", () => {
      clearInterval(interval);
      log.info("WebSocket disconnected:", client.id);
    });
  }),

  // Mapbox styles/tiles/fonts must bypass MSW's service-worker passthrough path,
  // which can throw "TypeError: Failed to fetch" for cross-origin requests.
  http.all(/https:\/\/([a-z0-9-]+\.)*mapbox\.com(\/|$)/i, async ({ request }) => {
    const url = new URL(request.url);

    if (
      request.method === "POST" &&
      (url.hostname === "events.mapbox.com" ||
        url.pathname.startsWith("/map-sessions/"))
    ) {
      return new HttpResponse(null, { status: 204 });
    }

    return fetch(bypass(request));
  }),

  http.get("/api/assets", async () => {
    await delay(350);
    return HttpResponse.json({ items: getAssets() });
  }),

  http.post("/api/assets", async ({ request }) => {
    await delay(400);
    const body = await request.json();
    const parsed = createAssetSchema.safeParse(body);

    if (!parsed.success) {
      return HttpResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    return HttpResponse.json(createAsset(parsed.data), { status: 201 });
  }),

  http.get("/api/customers", async () => {
    await delay(350);
    return HttpResponse.json({ items: getCustomers() });
  }),

  http.get("/api/customers/:id", async ({ params }) => {
    await delay(300);
    const customer = getCustomerById(params.id as string);

    if (!customer) {
      return HttpResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return HttpResponse.json(customer);
  }),

  http.post("/api/customers", async ({ request }) => {
    await delay(400);
    const body = await request.json();
    const parsed = createCustomerSchema.safeParse(body);

    if (!parsed.success) {
      return HttpResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, relatedOnuId, location, ...rest } = parsed.data;
    return HttpResponse.json(
      createCustomer({
        ...rest,
        email: email || undefined,
        relatedOnuId: relatedOnuId || undefined,
        location,
      }),
      { status: 201 }
    );
  }),

  http.patch("/api/customers/:id", async ({ request, params }) => {
    await delay(400);
    const id = params.id as string;
    const body = await request.json();
    const parsed = updateCustomerSchema.safeParse(body);

    if (!parsed.success) {
      return HttpResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    try {
      const { email, relatedOnuId, ...rest } = parsed.data;
      return HttpResponse.json(
        updateCustomer(id, {
          ...rest,
          email: email === "" ? undefined : email,
          relatedOnuId: relatedOnuId || undefined,
        })
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update customer";
      return HttpResponse.json({ error: message }, { status: 404 });
    }
  }),

  http.get("/api/incidents", async () => {
    await delay(450);
    return HttpResponse.json({ items: getIncidents() });
  }),

  http.get("/api/incidents/:id", async ({ params }) => {
    await delay(300);
    const incident = getIncidentById(params.id as string);

    if (!incident) {
      return HttpResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    return HttpResponse.json(incident);
  }),

  http.post("/api/incidents", async ({ request }) => {
    await delay(400);
    const body = await request.json();
    const parsed = createIncidentSchema.safeParse(body);

    if (!parsed.success) {
      return HttpResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    return HttpResponse.json(createIncident(parsed.data), { status: 201 });
  }),

  http.patch("/api/incidents/:id", async ({ request, params }) => {
    await delay(400);
    const id = params.id as string;
    const body = (await request.json()) as {
      status?: string;
      notes?: string;
      technician?: string;
      resolutionNotes?: string;
    };

    const resolveParsed = resolveIncidentSchema.safeParse(body);
    if (resolveParsed.success && body.status === "resolved") {
      try {
        return HttpResponse.json(
          resolveIncident(id, resolveParsed.data.resolutionNotes)
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to resolve incident";
        return HttpResponse.json({ error: message }, { status: 404 });
      }
    }

    const parsed = updateIncidentSchema.safeParse(body);

    if (!parsed.success) {
      return HttpResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    try {
      return HttpResponse.json(updateIncident(id, parsed.data));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update incident";
      return HttpResponse.json({ error: message }, { status: 404 });
    }
  }),

  http.get("/api/work-orders", async () => {
    await delay(400);
    return HttpResponse.json({ items: getWorkOrders() });
  }),

  http.get("/api/work-orders/:id", async ({ params }) => {
    await delay(300);
    const order = getWorkOrderById(params.id as string);

    if (!order) {
      return HttpResponse.json({ error: "Work order not found" }, { status: 404 });
    }

    return HttpResponse.json(order);
  }),

  http.post("/api/work-orders", async ({ request }) => {
    await delay(400);
    const body = await request.json();
    const parsed = createWorkOrderSchema.safeParse(body);

    if (!parsed.success) {
      return HttpResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    return HttpResponse.json(createWorkOrder(parsed.data), { status: 201 });
  }),

  http.patch("/api/work-orders/:id", async ({ request, params }) => {
    await delay(400);
    const id = params.id as string;
    const body = await request.json();
    const parsed = updateWorkOrderSchema.safeParse(body);

    if (!parsed.success) {
      return HttpResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    try {
      return HttpResponse.json(updateWorkOrder(id, parsed.data));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update work order";
      return HttpResponse.json({ error: message }, { status: 404 });
    }
  }),

  http.get("/api/planning/proposals", async () => {
    await delay(350);
    return HttpResponse.json({ items: getPlanningProposals() });
  }),

  http.get("/api/planning/proposals/:id", async ({ params }) => {
    await delay(300);
    const proposal = getPlanningProposalById(params.id as string);

    if (!proposal) {
      return HttpResponse.json(
        { error: "Planning proposal not found" },
        { status: 404 }
      );
    }

    return HttpResponse.json(proposal);
  }),

  http.post("/api/planning/proposals", async ({ request }) => {
    await delay(400);
    const body = await request.json();
    const parsed = createProposalSchema.safeParse(body);

    if (!parsed.success) {
      return HttpResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    return HttpResponse.json(createPlanningProposal(parsed.data), {
      status: 201,
    });
  }),

  http.patch("/api/planning/proposals/:id", async ({ request, params }) => {
    await delay(400);
    const id = params.id as string;
    const body = await request.json();
    const parsed = updateProposalSchema.safeParse(body);

    if (!parsed.success) {
      return HttpResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    try {
      return HttpResponse.json(updatePlanningProposal(id, parsed.data));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update planning proposal";
      return HttpResponse.json({ error: message }, { status: 404 });
    }
  }),

  http.get("/api/settings/organization", async () => {
    await delay(350);
    return HttpResponse.json(getOrganizationSettings());
  }),

  http.patch("/api/settings/organization", async ({ request }) => {
    await delay(350);
    const body = await request.json();
    const parsed = organizationSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return HttpResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    return HttpResponse.json(setOrganizationSettings(parsed.data));
  }),

  http.get("/api/settings/integrations", async () => {
    await delay(350);
    return HttpResponse.json(getIntegrationsSettings());
  }),

  http.patch("/api/settings/integrations/webhook", async ({ request }) => {
    await delay(350);
    const body = (await request.json()) as OutboundWebhookFormValues;
    const parsed = validateOutboundWebhook(body, webhookHasExistingSecret());

    if (!parsed.success) {
      return HttpResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    return HttpResponse.json(updateOutboundWebhook(parsed.data));
  }),

  http.patch("/api/settings/integrations/:id", async ({ request, params }) => {
    await delay(350);
    const id = params.id as IntegrationProviderId;
    const validIds: IntegrationProviderId[] = [
      "mapbox",
      "slack",
      "pagerduty",
      "stripe",
    ];

    if (!validIds.includes(id)) {
      return HttpResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    const body = (await request.json()) as IntegrationUpdateFormValues;
    const parsed = validateIntegrationUpdate(
      id,
      body,
      integrationHasExistingCredentials(id)
    );

    if (!parsed.success) {
      return HttpResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    return HttpResponse.json(updateIntegration(id, parsed.data));
  }),

  http.get("/api/settings/billing", async () => {
    await delay(350);
    return HttpResponse.json(getBillingSettingsPayload());
  }),

  http.patch("/api/settings/billing", async ({ request }) => {
    await delay(350);
    const body = (await request.json()) as BillingSettingsFormValues;
    const parsed = billingSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return HttpResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    return HttpResponse.json(setBillingSettings(parsed.data));
  }),

  http.post("/api/settings/billing/sync", async () => {
    await delay(500);

    try {
      return HttpResponse.json(syncBillingWithStripe());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to sync billing data";

      return HttpResponse.json({ error: message }, { status: 400 });
    }
  }),

  http.get("/api/settings/team", async () => {
    await delay(350);
    return HttpResponse.json(getTeamSettings());
  }),

  http.patch("/api/settings/team/members/:id", async ({ request, params }) => {
    await delay(350);
    const memberId = params.id as string;
    const body = (await request.json()) as TeamMemberUpdateFormValues;
    const parsed = teamMemberUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return HttpResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    try {
      return HttpResponse.json(updateTeamMemberRole(memberId, parsed.data));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update team member";

      return HttpResponse.json({ error: message }, { status: 400 });
    }
  }),

  http.post("/api/settings/team/invites", async ({ request }) => {
    await delay(350);
    const body = (await request.json()) as TeamInviteFormValues;
    const parsed = teamInviteSchema.safeParse(body);

    if (!parsed.success) {
      return HttpResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    try {
      return HttpResponse.json(createTeamInvite(parsed.data));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send invite";

      return HttpResponse.json({ error: message }, { status: 400 });
    }
  }),

  http.delete("/api/settings/team/invites/:id", async ({ params }) => {
    await delay(350);
    const inviteId = params.id as string;

    try {
      return HttpResponse.json(revokeTeamInvite(inviteId));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to revoke invite";

      return HttpResponse.json({ error: message }, { status: 400 });
    }
  }),

  http.get("/api/reports/summary", async () => {
    await delay(300);
    return HttpResponse.json(getReportsSummary());
  }),

  http.get("/api/reports/incidents/analytics", async ({ request }) => {
    await delay(300);
    const period = new URL(request.url).searchParams.get("period") ?? "30d";
    return HttpResponse.json(getIncidentAnalytics(period));
  }),

  http.get("/api/reports/uptime", async ({ request }) => {
    await delay(300);
    const period = new URL(request.url).searchParams.get("period") ?? "6m";
    return HttpResponse.json(getUptimeSummary(period));
  }),

  http.get("/api/reports/history", async () => {
    await delay(250);
    return HttpResponse.json({ items: getReportHistory() });
  }),

  http.get("/api/reports/:id/download", async ({ params }) => {
    await delay(200);
    const reportId = params.id as string;
    const download = getReportDownloadById(reportId);

    if (!download) {
      return HttpResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return HttpResponse.json(download);
  }),

  http.post("/api/reports/generate", async ({ request }) => {
    await delay(450);
    const body = await request.json();
    const parsed = generateReportSchema.safeParse(body);

    if (!parsed.success) {
      return HttpResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = generateReport(parsed.data);
    return HttpResponse.json(result);
  }),

  // Network usage statistics for the dashboard charts
  http.get("/api/stats/usage", async () => {
    await delay(200);
    // Generate some variability for "live" feel
    const baseTrends = [
      { label: "00:00", value: 450 + Math.random() * 50 },
      { label: "02:00", value: 380 + Math.random() * 40 },
      { label: "04:00", value: 320 + Math.random() * 30 },
      { label: "06:00", value: 410 + Math.random() * 50 },
      { label: "08:00", value: 580 + Math.random() * 80 },
      { label: "10:00", value: 720 + Math.random() * 90 },
      { label: "12:00", value: 850 + Math.random() * 100 },
      { label: "14:00", value: 790 + Math.random() * 80 },
      { label: "16:00", value: 830 + Math.random() * 90 },
      { label: "18:00", value: 920 + Math.random() * 110 },
      { label: "20:00", value: 880 + Math.random() * 100 },
      { label: "22:00", value: 740 + Math.random() * 80 },
      { label: "23:59", value: 600 + Math.random() * 60 },
    ];
    return HttpResponse.json(baseTrends);
  }),

  // Fallback for API routes added in the UI before a dedicated mock exists
  http.all("/api/*", ({ request }) => {
    return HttpResponse.json(
      { error: `No mock handler for ${request.method} ${new URL(request.url).pathname}` },
      { status: 404 }
    );
  }),
];

