import { createAsset, getAssets, updateAsset } from "@/mocks/assetsData";
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
  acceptTeamInvite,
  createTeamInvite,
  getInviteByToken,
  getTeamSettings,
  removeTeamMember,
  revokeTeamInvite,
  updateTeamMemberRole,
} from "@/mocks/teamData";
import {
  authenticateMockUser,
  getUserByToken,
  logoutMockToken,
  registerMockUser,
  registerSession,
} from "@/mocks/authData";
import { getWebhookDeliveries } from "@/mocks/webhookDispatcher";
import { canAccessSettings, roleAtLeast } from "@/lib/auth/rbac";
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
  validateMikrotikTest,
  validateOutboundWebhook,
} from "@/modules/settings/schemas/integrationsSettings.schema";
import type { IntegrationProviderId } from "@/types/domain";
import type {
  IntegrationUpdateFormValues,
  MikrotikTestFormValues,
  OutboundWebhookFormValues,
} from "@/modules/settings/schemas/integrationsSettings.schema";
import {
  getIntegrationsSettings,
  getMapboxAccessToken,
  getMikrotikSavedCredentials,
  integrationHasExistingCredentials,
  testMikrotikConnection,
  updateIntegration,
  updateOutboundWebhook,
  webhookHasExistingSecret,
} from "@/mocks/integrationsData";
import {
  getBillingSettingsPayload,
  setBillingSettings,
  syncBillingWithStripe,
} from "@/mocks/billingData";

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function validationError(issues: unknown) {
  return json({ error: "Validation failed", issues }, 400);
}

function notFound(message: string) {
  return json({ error: message }, 404);
}

function unauthorized(message = "Authentication required") {
  return json({ error: message }, 401);
}

function forbidden(message = "Admin access required") {
  return json({ error: message }, 403);
}

function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function requireUser(
  request: Request
): { user: NonNullable<ReturnType<typeof getUserByToken>> } | { error: Response } {
  const user = getUserByToken(extractBearerToken(request));
  if (!user) return { error: unauthorized() };
  return { user };
}

function requireAdmin(
  request: Request
): { user: NonNullable<ReturnType<typeof getUserByToken>> } | { error: Response } {
  const result = requireUser(request);
  if ("error" in result) return result;
  if (!canAccessSettings(result.user)) {
    return { error: forbidden() };
  }
  return { user: result.user };
}

function getUsageStats() {
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
  return json(baseTrends);
}

export async function handleApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const segments = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  const method = request.method;

  try {
    if (segments[0] === "auth") {
      if (segments[1] === "login" && method === "POST") {
        const body = (await request.json()) as { email?: string; password?: string };
        const result = authenticateMockUser(body.email ?? "", body.password ?? "");
        if (!result) {
          return json({ error: "Invalid email or password" }, 401);
        }
        return json(result);
      }
      if (segments[1] === "register" && method === "POST") {
        const body = (await request.json()) as {
          name?: string;
          email?: string;
          password?: string;
        };
        const result = registerMockUser(
          body.name ?? "",
          body.email ?? "",
          body.password ?? ""
        );
        if ("error" in result) {
          return json({ error: result.error }, 400);
        }
        return json(result, 201);
      }
      if (segments[1] === "logout" && method === "POST") {
        logoutMockToken(extractBearerToken(request));
        return json({ ok: true });
      }
      if (segments[1] === "accept-invite" && method === "POST") {
        const body = (await request.json()) as {
          token?: string;
          name?: string;
          password?: string;
        };
        try {
          const result = acceptTeamInvite({
            token: body.token ?? "",
            name: body.name ?? "",
            password: body.password ?? "",
          });
          registerSession(result.user, result.token);
          return json(result, 201);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unable to accept invite";
          return json({ error: message }, 400);
        }
      }
      if (segments[1] === "invite" && segments[2] && method === "GET") {
        const invite = getInviteByToken(segments[2]);
        if (!invite) return notFound("Invite not found");
        if (invite.expiresAt && new Date(invite.expiresAt).getTime() < Date.now()) {
          return json({ error: "This invite has expired" }, 400);
        }
        return json({
          email: invite.email,
          role: invite.role,
          expiresAt: invite.expiresAt,
        });
      }
    }

    if (segments[0] === "settings" && segments[1] === "integrations" && segments[2] === "deliveries" && method === "GET") {
      const admin = requireAdmin(request);
      if ("error" in admin) return admin.error;
      return json({ items: getWebhookDeliveries() });
    }

    if (segments[0] === "me" && method === "GET") {
      const auth = requireUser(request);
      if ("error" in auth) return auth.error;
      return json({ user: auth.user });
    }

    if (segments[0] === "maps" && segments[1] === "mapbox-token" && method === "GET") {
      const auth = requireUser(request);
      if ("error" in auth) return auth.error;
      if (!roleAtLeast(auth.user.role, "viewer")) {
        return forbidden("Insufficient permissions");
      }

      const integrationToken = getMapboxAccessToken();
      if (integrationToken) {
        return json({ accessToken: integrationToken, source: "integration" });
      }

      const envToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
      if (envToken) {
        return json({ accessToken: envToken, source: "env" });
      }

      return json({ accessToken: null, source: "none" });
    }

    if (segments[0] === "settings") {
      const admin = requireAdmin(request);
      if ("error" in admin) return admin.error;

      if (segments[1] === "organization") {
        if (method === "GET") return json(getOrganizationSettings());
        if (method === "PATCH") {
          const body = await request.json();
          const parsed = organizationSettingsSchema.safeParse(body);
          if (!parsed.success) return validationError(parsed.error.flatten());
          return json(setOrganizationSettings(parsed.data));
        }
      }

      if (segments[1] === "integrations") {
        if (segments.length === 2 && method === "GET") {
          return json(getIntegrationsSettings());
        }
        if (segments[2] === "webhook" && method === "PATCH") {
          const body = (await request.json()) as OutboundWebhookFormValues;
          const parsed = validateOutboundWebhook(body, webhookHasExistingSecret());
          if (!parsed.success) return validationError(parsed.error.flatten());
          return json(updateOutboundWebhook(parsed.data));
        }
        if (segments[2] === "mikrotik" && segments[3] === "test" && method === "POST") {
          const body = (await request.json().catch(() => ({}))) as MikrotikTestFormValues;
          const parsed = validateMikrotikTest(body, getMikrotikSavedCredentials());
          if (!parsed.success) return validationError(parsed.error.flatten());
          const result = testMikrotikConnection(parsed.data);
          return json(result, result.ok ? 200 : 422);
        }
        if (segments.length === 3 && method === "PATCH") {
          const id = segments[2] as IntegrationProviderId;
          const validIds: IntegrationProviderId[] = [
            "mapbox",
            "slack",
            "pagerduty",
            "stripe",
            "mikrotik",
          ];
          if (!validIds.includes(id)) return notFound("Integration not found");
          const body = (await request.json()) as IntegrationUpdateFormValues;
          const parsed = validateIntegrationUpdate(
            id,
            body,
            integrationHasExistingCredentials(id)
          );
          if (!parsed.success) return validationError(parsed.error.flatten());
          return json(updateIntegration(id, parsed.data));
        }
      }

      if (segments[1] === "billing") {
        if (segments.length === 2 && method === "GET") {
          return json(getBillingSettingsPayload());
        }
        if (segments.length === 2 && method === "PATCH") {
          const body = (await request.json()) as BillingSettingsFormValues;
          const parsed = billingSettingsSchema.safeParse(body);
          if (!parsed.success) return validationError(parsed.error.flatten());
          return json(setBillingSettings(parsed.data));
        }
        if (segments[2] === "sync" && method === "POST") {
          try {
            return json(syncBillingWithStripe());
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Failed to sync billing data";
            return json({ error: message }, 400);
          }
        }
      }

      if (segments[1] === "team") {
        if (segments.length === 2 && method === "GET") {
          return json(getTeamSettings());
        }
        if (segments[2] === "members" && segments.length === 4 && method === "PATCH") {
          const body = (await request.json()) as TeamMemberUpdateFormValues;
          const parsed = teamMemberUpdateSchema.safeParse(body);
          if (!parsed.success) return validationError(parsed.error.flatten());
          try {
            return json(updateTeamMemberRole(segments[3], parsed.data));
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Failed to update team member";
            return json({ error: message }, 400);
          }
        }
        if (segments[2] === "members" && segments.length === 4 && method === "DELETE") {
          try {
            return json(removeTeamMember(segments[3]));
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Failed to remove team member";
            return json({ error: message }, 400);
          }
        }
        if (segments[2] === "invites") {
          if (segments.length === 3 && method === "POST") {
            const body = (await request.json()) as TeamInviteFormValues;
            const parsed = teamInviteSchema.safeParse(body);
            if (!parsed.success) return validationError(parsed.error.flatten());
            try {
              return json(
                createTeamInvite(parsed.data, { actorEmail: admin.user.email }),
                201
              );
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Failed to send invite";
              return json({ error: message }, 400);
            }
          }
          if (segments.length === 4 && method === "DELETE") {
            try {
              return json(revokeTeamInvite(segments[3]));
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Failed to revoke invite";
              return json({ error: message }, 400);
            }
          }
        }
      }
    }

    if (segments.length === 1 && segments[0] === "assets") {
      if (method === "GET") {
        return json({ items: getAssets() });
      }
      if (method === "POST") {
        const body = await request.json();
        const parsed = createAssetSchema.safeParse(body);
        if (!parsed.success) return validationError(parsed.error.flatten());
        return json(createAsset(parsed.data), 201);
      }
    }

    if (segments[0] === "assets" && segments.length === 2 && method === "PATCH") {
      const body = await request.json();
      try {
        return json(
          updateAsset(segments[1], {
            name: body.name,
            status: body.status,
            monitorHost: body.monitorHost,
            location: body.location,
          })
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to update asset";
        return notFound(message);
      }
    }

    if (segments[0] === "customers") {
      if (segments.length === 1 && method === "GET") {
        return json({ items: getCustomers() });
      }
      if (segments.length === 1 && method === "POST") {
        const body = await request.json();
        const parsed = createCustomerSchema.safeParse(body);
        if (!parsed.success) return validationError(parsed.error.flatten());
        const { email, relatedOnuId, location, pppoeUsername, ...rest } = parsed.data;
        return json(
          createCustomer({
            ...rest,
            email: email || undefined,
            pppoeUsername: pppoeUsername || undefined,
            relatedOnuId: relatedOnuId || undefined,
            location,
          }),
          201
        );
      }
      if (segments.length === 2 && method === "GET") {
        const customer = getCustomerById(segments[1]);
        if (!customer) return notFound("Customer not found");
        return json(customer);
      }
      if (segments.length === 2 && method === "PATCH") {
        const body = await request.json();
        const parsed = updateCustomerSchema.safeParse(body);
        if (!parsed.success) return validationError(parsed.error.flatten());
        try {
          const { email, relatedOnuId, pppoeUsername, ...rest } = parsed.data;
          return json(
            updateCustomer(segments[1], {
              ...rest,
              email: email === "" ? undefined : email,
              pppoeUsername: pppoeUsername === "" ? undefined : pppoeUsername,
              relatedOnuId: relatedOnuId || undefined,
            })
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to update customer";
          return notFound(message);
        }
      }
    }

    if (segments[0] === "incidents") {
      if (segments.length === 1 && method === "GET") {
        return json({ items: getIncidents() });
      }
      if (segments.length === 1 && method === "POST") {
        const body = await request.json();
        const parsed = createIncidentSchema.safeParse(body);
        if (!parsed.success) return validationError(parsed.error.flatten());
        return json(createIncident(parsed.data), 201);
      }
      if (segments.length === 2 && method === "GET") {
        const incident = getIncidentById(segments[1]);
        if (!incident) return notFound("Incident not found");
        return json(incident);
      }
      if (segments.length === 2 && method === "PATCH") {
        const body = (await request.json()) as {
          status?: string;
          notes?: string;
          technician?: string;
          resolutionNotes?: string;
        };
        const resolveParsed = resolveIncidentSchema.safeParse(body);
        if (resolveParsed.success && body.status === "resolved") {
          try {
            return json(resolveIncident(segments[1], resolveParsed.data.resolutionNotes));
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Failed to resolve incident";
            return notFound(message);
          }
        }
        const parsed = updateIncidentSchema.safeParse(body);
        if (!parsed.success) return validationError(parsed.error.flatten());
        try {
          return json(updateIncident(segments[1], parsed.data));
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to update incident";
          return notFound(message);
        }
      }
    }

    if (segments[0] === "work-orders") {
      if (segments.length === 1 && method === "GET") {
        return json({ items: getWorkOrders() });
      }
      if (segments.length === 1 && method === "POST") {
        const body = await request.json();
        const parsed = createWorkOrderSchema.safeParse(body);
        if (!parsed.success) return validationError(parsed.error.flatten());
        return json(createWorkOrder(parsed.data), 201);
      }
      if (segments.length === 2 && method === "GET") {
        const order = getWorkOrderById(segments[1]);
        if (!order) return notFound("Work order not found");
        return json(order);
      }
      if (segments.length === 2 && method === "PATCH") {
        const body = await request.json();
        const parsed = updateWorkOrderSchema.safeParse(body);
        if (!parsed.success) return validationError(parsed.error.flatten());
        try {
          return json(updateWorkOrder(segments[1], parsed.data));
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to update work order";
          return notFound(message);
        }
      }
    }

    if (segments[0] === "planning" && segments[1] === "proposals") {
      if (segments.length === 2 && method === "GET") {
        return json({ items: getPlanningProposals() });
      }
      if (segments.length === 2 && method === "POST") {
        const body = await request.json();
        const parsed = createProposalSchema.safeParse(body);
        if (!parsed.success) return validationError(parsed.error.flatten());
        return json(createPlanningProposal(parsed.data), 201);
      }
      if (segments.length === 3 && method === "GET") {
        const proposal = getPlanningProposalById(segments[2]);
        if (!proposal) return notFound("Planning proposal not found");
        return json(proposal);
      }
      if (segments.length === 3 && method === "PATCH") {
        const body = await request.json();
        const parsed = updateProposalSchema.safeParse(body);
        if (!parsed.success) return validationError(parsed.error.flatten());
        try {
          return json(updatePlanningProposal(segments[2], parsed.data));
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to update planning proposal";
          return notFound(message);
        }
      }
    }

    if (segments[0] === "reports") {
      if (segments[1] === "summary" && method === "GET") {
        return json(getReportsSummary());
      }
      if (segments[1] === "incidents" && segments[2] === "analytics" && method === "GET") {
        const period = url.searchParams.get("period") ?? "30d";
        return json(getIncidentAnalytics(period));
      }
      if (segments[1] === "uptime" && method === "GET") {
        const period = url.searchParams.get("period") ?? "6m";
        return json(getUptimeSummary(period));
      }
      if (segments[1] === "history" && method === "GET") {
        return json({ items: getReportHistory() });
      }
      if (segments[1] === "generate" && method === "POST") {
        const body = await request.json();
        const parsed = generateReportSchema.safeParse(body);
        if (!parsed.success) return validationError(parsed.error.flatten());
        return json(generateReport(parsed.data));
      }
      if (segments.length === 3 && segments[2] === "download" && method === "GET") {
        const download = getReportDownloadById(segments[1]);
        if (!download) return notFound("Report not found");
        return json(download);
      }
    }

    if (segments[0] === "stats" && segments[1] === "usage" && method === "GET") {
      return getUsageStats();
    }

    return json(
      { error: `No mock handler for ${method} ${url.pathname}` },
      404
    );
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }
}
