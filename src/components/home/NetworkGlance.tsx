"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Badge,
  Button,
  Callout,
  Card,
  Grid,
  GridCol,
  Icon,
} from "@shohojdhara/atomix";
import { ClientOnly } from "@/components/ClientOnly";
import type { Incident } from "@/types/domain";
import { formatRelativeTimeFromIso } from "@/lib/operationsViewMappers";

type NetworkGlanceProps = {
  activeIncidents: Incident[];
  networkAvailability: number | null;
  slaCompliant?: boolean;
  isLoading?: boolean;
};

export function NetworkGlance({
  activeIncidents,
  networkAvailability,
  slaCompliant,
  isLoading = false,
}: NetworkGlanceProps) {
  const { data: usageData, isLoading: isUsageLoading } = useQuery({
    queryKey: ["network-trends"],
    queryFn: async () => {
      const res = await fetch("/api/stats/usage");
      if (!res.ok) throw new Error("Failed to fetch usage stats");
      return res.json();
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const topIncident = [...activeIncidents].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  const chartLoading = isLoading || isUsageLoading;

  return (
    <section className="u-mb-8" aria-labelledby="home-glance-heading">
      <div className="u-section-header">
        <h2 id="home-glance-heading" className="u-section-heading u-mb-0">
          Network at a glance
        </h2>
        <Link href="/dashboard" className="u-text-decoration-none">
          <Button variant="outline-secondary" size="sm">
            Full dashboard
          </Button>
        </Link>
      </div>

      <Grid>
        <GridCol xs={12} lg={8}>
          <Card title="Usage trend (24h)" className="u-h-100">
            <div className="u-network-glance__chart">
              {chartLoading ? (
                <div
                  className="u-skeleton u-h-100 u-w-100"
                  aria-busy="true"
                  aria-label="Loading usage chart"
                />
              ) : (
                <ClientOnly>
                  <AreaChart
                    datasets={[
                      {
                        label: "Network Usage",
                        data: usageData || [],
                        color: "var(--atomix-primary)",
                      },
                    ]}
                    variant="primary"
                    interactive={false}
                    showLegend={false}
                    areaOptions={{
                      smooth: true,
                      useGradient: true,
                      showDataPoints: false,
                    }}
                    config={{
                      xAxis: { showGrid: false, label: "Time" },
                      yAxis: {
                        showGrid: true,
                        label: "Mbps",
                        formatter: (val: unknown) => `${val}M`,
                      },
                    }}
                  />
                </ClientOnly>
              )}
            </div>
          </Card>
        </GridCol>

        <GridCol xs={12} lg={4}>
          <Card title="Live status" className="u-h-100">
            <div className="u-flex u-flex-column u-gap-4 u-h-100">
              <div className="u-network-glance__stat">
                <span className="u-text-secondary-emphasis u-text-sm u-font-bold">
                  Availability
                </span>
                <div className="u-flex u-items-center u-gap-2 u-mt-1">
                  {isLoading ? (
                    <div className="u-skeleton u-h-8 u-w-25" aria-hidden="true" />
                  ) : (
                    <>
                      <span className="u-text-xxl u-font-bold">
                        {networkAvailability !== null ? `${networkAvailability}%` : "—"}
                      </span>
                      {slaCompliant !== undefined && (
                        <Badge
                          variant={slaCompliant ? "success" : "warning"}
                          label={slaCompliant ? "SLA met" : "Below SLA"}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>

              {isLoading ? (
                <div className="u-skeleton u-h-24 u-w-100" aria-hidden="true" />
              ) : topIncident ? (
                <Callout
                  variant="error"
                  title={topIncident.title}
                  icon={<Icon name="Warning" />}
                >
                  <div className="u-flex u-justify-between u-items-center u-mb-1">
                    <span className="u-meta">{topIncident.id}</span>
                    <span className="u-meta">
                      {formatRelativeTimeFromIso(topIncident.createdAt)}
                    </span>
                  </div>
                  <p className="u-body-sm u-mb-3">
                    {activeIncidents.length} active incident
                    {activeIncidents.length === 1 ? "" : "s"} across the network.
                  </p>
                  <Link
                    href={`/incidents?selected=${topIncident.id}`}
                    className="u-text-decoration-none"
                  >
                    <Button variant="outline-secondary" size="sm">
                      View incident
                    </Button>
                  </Link>
                </Callout>
              ) : (
                <Callout
                  variant="success"
                  title="All systems operational"
                  icon={<Icon name="CheckCircle" />}
                >
                  <p className="u-body-sm u-mb-0">
                    No active incidents. Network health is stable.
                  </p>
                </Callout>
              )}
            </div>
          </Card>
        </GridCol>
      </Grid>
    </section>
  );
}
