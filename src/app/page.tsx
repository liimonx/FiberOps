"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { Button, Container, Grid, GridCol, Icon, Callout } from "@shohojdhara/atomix";
import {
  ActivityFeed,
  AppLauncherCard,
  HomeHero,
  MetricCard,
  NetworkGlance,
} from "@/components/home";
import {
  buildHomeActivityFeed,
  countCustomersAddedThisMonth,
  countIncidentsResolvedSince,
} from "@/lib/homeActivity";
import { getLauncherItemsByGroup } from "@/lib/navigation";
import {
  getHighPriorityOpenWorkOrderCount,
  getOpenWorkOrderCount,
} from "@/lib/operationsViewMappers";
import {
  useActiveIncidents,
  useCustomers,
  useIncidents,
  useWorkOrders,
} from "@/modules/network-map/hooks/useNetworkData";
import { useReportsSummary } from "@/modules/reports/hooks/useReportsData";
import { useTeamSettings } from "@/modules/settings/hooks/useTeamSettings";

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

export default function Home() {
  const {
    data: customers,
    isLoading: isCustomersLoading,
    isFetching: isCustomersFetching,
    isError: isCustomersError,
    refetch: refetchCustomers,
  } = useCustomers();
  const {
    data: activeIncidents,
    isLoading: isIncidentsLoading,
    isFetching: isIncidentsFetching,
    isError: isIncidentsError,
    refetch: refetchIncidents,
  } = useActiveIncidents();
  const {
    data: allIncidents,
    refetch: refetchAllIncidents,
  } = useIncidents();
  const {
    data: workOrders,
    isLoading: isWorkOrdersLoading,
    isFetching: isWorkOrdersFetching,
    isError: isWorkOrdersError,
    refetch: refetchWorkOrders,
  } = useWorkOrders();
  const {
    data: summary,
    isLoading: isSummaryLoading,
    isFetching: isSummaryFetching,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = useReportsSummary();
  const { data: teamSettings } = useTeamSettings();

  const orderList = workOrders ?? [];
  const customerList = customers ?? [];
  const incidentList = allIncidents ?? [];
  const activeIncidentList = activeIncidents ?? [];
  const openWorkOrderCount = getOpenWorkOrderCount(orderList);
  const highPriorityCount = getHighPriorityOpenWorkOrderCount(orderList);
  const activeIncidentCount = activeIncidentList.length;
  const subscriberCount = customerList.length;
  const netAddsThisMonth = countCustomersAddedThisMonth(customerList);
  const resolvedSinceYesterday = countIncidentsResolvedSince(incidentList, 24);
  const networkAvailability = summary?.networkUptimePercent ?? null;

  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    (teamSettings?.members ?? []).forEach((member) => map.set(member.id, member.name));
    return map;
  }, [teamSettings?.members]);

  const activityItems = useMemo(
    () => buildHomeActivityFeed(incidentList, orderList, memberNameById),
    [incidentList, orderList, memberNameById]
  );

  const launcherBadges = useMemo(
    () => ({
      "/incidents": activeIncidentCount,
      "/work-orders": openWorkOrderCount,
    }),
    [activeIncidentCount, openWorkOrderCount]
  );

  const coreApps = useMemo(
    () => getLauncherItemsByGroup("core", launcherBadges),
    [launcherBadges]
  );
  const managementApps = useMemo(
    () => getLauncherItemsByGroup("management", launcherBadges),
    [launcherBadges]
  );

  const isLoading =
    isCustomersLoading ||
    isIncidentsLoading ||
    isWorkOrdersLoading ||
    isSummaryLoading;
  const isRefreshing =
    isCustomersFetching ||
    isIncidentsFetching ||
    isWorkOrdersFetching ||
    isSummaryFetching;
  const isError =
    isCustomersError || isIncidentsError || isWorkOrdersError || isSummaryError;

  const handleRefresh = useCallback(() => {
    refetchCustomers();
    refetchIncidents();
    refetchAllIncidents();
    refetchWorkOrders();
    refetchSummary();
  }, [
    refetchCustomers,
    refetchIncidents,
    refetchAllIncidents,
    refetchWorkOrders,
    refetchSummary,
  ]);

  if (isError) {
    return (
      <Container className="u-page">
        <Callout variant="error" title="Failed to load operations center">
          <p className="u-text-sm u-mb-3">
            Metrics and activity could not be loaded. Please try again.
          </p>
          <Button variant="outline-secondary" size="sm" onClick={handleRefresh}>
            Retry
          </Button>
        </Callout>
      </Container>
    );
  }

  return (
    <Container className="u-page">
      <HomeHero onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      <section className="u-mb-8" aria-labelledby="home-metrics-heading">
        <h2 id="home-metrics-heading" className="u-section-heading">
          Key metrics
        </h2>
        <Grid>
          <GridCol xs={12} sm={6} lg={3}>
            <MetricCard
              label="Active subscribers"
              value={formatCount(subscriberCount)}
              icon="Users"
              href="/customers"
              isLoading={isLoading}
              footer={
                <span className="u-flex u-items-center u-gap-1 u-text-success">
                  <Icon name="TrendUp" size="sm" aria-hidden="true" />
                  <span>
                    {netAddsThisMonth > 0
                      ? `+${formatCount(netAddsThisMonth)} net adds this month`
                      : "No new subscribers this month"}
                  </span>
                </span>
              }
            />
          </GridCol>

          <GridCol xs={12} sm={6} lg={3}>
            <MetricCard
              label="Open incidents"
              value={activeIncidentCount}
              icon="Warning"
              iconClassName="u-text-error"
              iconBgClassName="u-bg-error-subtle"
              href="/incidents"
              isLoading={isLoading}
              footer={
                <span className="u-flex u-items-center u-gap-1 u-text-error">
                  <Icon name="TrendDown" size="sm" aria-hidden="true" />
                  <span>
                    {resolvedSinceYesterday > 0
                      ? `${resolvedSinceYesterday} resolved since yesterday`
                      : "No incidents resolved in the last 24h"}
                  </span>
                </span>
              }
            />
          </GridCol>

          <GridCol xs={12} sm={6} lg={3}>
            <MetricCard
              label="Network availability"
              value={networkAvailability !== null ? `${networkAvailability}%` : "—"}
              icon="Pulse"
              iconClassName="u-text-success"
              iconBgClassName="u-bg-success-subtle"
              href="/reports"
              isLoading={isLoading}
              footer={
                <span className="u-text-secondary-emphasis">
                  Rolling 24-hour average across all nodes
                </span>
              }
            />
          </GridCol>

          <GridCol xs={12} sm={6} lg={3}>
            <MetricCard
              label="Open work orders"
              value={openWorkOrderCount}
              icon="Clipboard"
              iconClassName="u-text-warning"
              iconBgClassName="u-bg-warning-subtle"
              href="/work-orders"
              isLoading={isLoading}
              footer={
                <span className="u-text-warning">
                  {highPriorityCount} marked high priority
                </span>
              }
            />
          </GridCol>
        </Grid>
      </section>

      <NetworkGlance
        activeIncidents={activeIncidentList}
        networkAvailability={networkAvailability}
        slaCompliant={summary?.slaCompliant}
        isLoading={isLoading}
      />

      <section className="u-mb-8" aria-labelledby="home-apps-heading">
        <h2 id="home-apps-heading" className="u-section-heading">
          Applications
        </h2>

        <div className="u-launcher-subsection">
          <p className="u-launcher-subsection__title">Core operations</p>
          <Grid>
            {coreApps.map((item) => (
              <GridCol xs={12} sm={6} lg={3} key={item.href}>
                <AppLauncherCard item={item} />
              </GridCol>
            ))}
          </Grid>
        </div>

        <div className="u-launcher-subsection">
          <p className="u-launcher-subsection__title">Management & analytics</p>
          <Grid>
            {managementApps.map((item) => (
              <GridCol xs={12} sm={6} lg={3} key={item.href}>
                <AppLauncherCard item={item} />
              </GridCol>
            ))}
          </Grid>
        </div>
      </section>

      <section aria-labelledby="home-activity-heading">
        <div className="u-section-header">
          <h2 id="home-activity-heading" className="u-section-heading u-mb-0">
            Activity feed
          </h2>
          <Link href="/dashboard" className="u-text-decoration-none">
            <Button variant="outline-secondary" size="sm">
              View dashboard
            </Button>
          </Link>
        </div>
        {isLoading ? (
          <div
            className="u-skeleton u-h-48 u-rounded"
            aria-busy="true"
            aria-label="Loading activity feed"
          />
        ) : (
          <ActivityFeed items={activityItems} />
        )}
      </section>
    </Container>
  );
}
