"use client";

import Link from "next/link";
import { Card, Button, Icon, Grid, GridCol } from "@shohojdhara/atomix";
import type { PhosphorIconsType } from "@shohojdhara/atomix";
import { useWorkOrders } from "@/modules/network-map/hooks/useNetworkData";
import {
  getHighPriorityOpenWorkOrderCount,
  getOpenWorkOrderCount,
} from "@/lib/operationsViewMappers";

const quickActions: {
  title: string;
  description: string;
  href: string;
  icon: PhosphorIconsType;
  color: string;
}[] = [
  {
    title: "Network Map",
    description:
      "Explore routes, nodes, and service areas with live geographic context.",
    href: "/network-map",
    icon: "MapPin",
    color: "primary",
  },
  {
    title: "Incidents",
    description:
      "Track outages, degradations, and restoration status across the network.",
    href: "/incidents",
    icon: "Warning",
    color: "error",
  },
  {
    title: "Work Orders",
    description:
      "Manage installation, repair, and maintenance tasks for field teams.",
    href: "/work-orders",
    icon: "Clipboard",
    color: "success",
  },
  {
    title: "Assets",
    description:
      "Inspect cabinets, splitters, ONTs, and passive plant inventory.",
    href: "/assets",
    icon: "Package",
    color: "warning",
  },
];

const recentActivity = [
  {
    id: 1,
    type: "incident",
    message: "INC-1042: Fiber cut reported at Node Alpha — ticket auto-created",
    time: "10 minutes ago",
    severity: "error",
  },
  {
    id: 2,
    type: "workorder",
    message: "WO-991 assigned to field technician J. Doe",
    time: "25 minutes ago",
    severity: "info",
  },
  {
    id: 3,
    type: "maintenance",
    message: "PM-220: Preventive maintenance scheduled for Splitter S-08",
    time: "2 hours ago",
    severity: "warning",
  },
  {
    id: 4,
    type: "success",
    message: "ONT provisioning completed for residential subscriber",
    time: "3 hours ago",
    severity: "success",
  },
];

export default function Home() {
  const { data: workOrders } = useWorkOrders();
  const orderList = workOrders ?? [];
  const openWorkOrderCount = getOpenWorkOrderCount(orderList);
  const highPriorityCount = getHighPriorityOpenWorkOrderCount(orderList);

  return (
    <div className="u-py-6 u-w-100">
      <div className="u-mb-8">
        <p className="u-text-xs u-text-secondary-emphasis u-text-uppercase u-tracking-wider u-mb-2">
          Network operations
        </p>
        <h1 className="u-text-3xl u-font-bold u-mb-2">FiberOps Operations Center</h1>
        <p className="u-text-secondary-emphasis u-text-lg u-mb-0">
          Unified visibility and control for fiber infrastructure, field operations,
          and customer service. Use the modules below to monitor health, respond to
          events, and coordinate work across your organization.
        </p>
      </div>

      <div className="u-mb-8">
        <h2 className="u-text-xl u-font-bold u-mb-4">Key metrics</h2>
        <Grid>
          <GridCol xs={12} sm={6} lg={3}>
            <Card>
              <div className="u-flex u-items-center u-gap-3 u-mb-3">
                <div className="u-bg-primary-subtle u-rounded u-p-2">
                  <Icon name="Users" size="lg" />
                </div>
                <div>
                  <div className="u-text-xs u-text-secondary-emphasis">
                    Active subscribers
                  </div>
                  <div className="u-text-xl u-font-bold">12,492</div>
                </div>
              </div>
              <div className="u-text-xs u-text-success u-flex u-items-center u-gap-1">
                <Icon name="TrendUp" size="sm" />
                <span>+124 net adds this month</span>
              </div>
            </Card>
          </GridCol>

          <GridCol xs={12} sm={6} lg={3}>
            <Card>
              <div className="u-flex u-items-center u-gap-3 u-mb-3">
                <div className="u-bg-error-subtle u-rounded u-p-2">
                  <Icon name="Warning" className="u-text-error" size="lg" />
                </div>
                <div>
                  <div className="u-text-xs u-text-secondary-emphasis">
                    Open incidents
                  </div>
                  <div className="u-text-xl u-font-bold">3</div>
                </div>
              </div>
              <div className="u-text-xs u-text-error u-flex u-items-center u-gap-1">
                <Icon name="TrendDown" size="sm" />
                <span>1 resolved since yesterday</span>
              </div>
            </Card>
          </GridCol>

          <GridCol xs={12} sm={6} lg={3}>
            <Card>
              <div className="u-flex u-items-center u-gap-3 u-mb-3">
                <div className="u-bg-success-subtle u-rounded u-p-2">
                  <Icon name="Pulse" className="u-text-success" size="lg" />
                </div>
                <div>
                  <div className="u-text-xs u-text-secondary-emphasis">
                    Network availability
                  </div>
                  <div className="u-text-xl u-font-bold">99.4%</div>
                </div>
              </div>
              <div className="u-text-xs u-text-secondary-emphasis">
                Rolling 24-hour average across all nodes
              </div>
            </Card>
          </GridCol>

          <GridCol xs={12} sm={6} lg={3}>
            <Card>
              <div className="u-flex u-items-center u-gap-3 u-mb-3">
                <div className="u-bg-warning-subtle u-rounded u-p-2">
                  <Icon name="Clipboard" className="u-text-warning" size="lg" />
                </div>
                <div>
                  <div className="u-text-xs u-text-secondary-emphasis">
                    Open work orders
                  </div>
                  <div className="u-text-xl u-font-bold">{openWorkOrderCount}</div>
                </div>
              </div>
              <div className="u-text-xs u-text-warning">
                {highPriorityCount} marked high priority
              </div>
            </Card>
          </GridCol>
        </Grid>
      </div>

      <div className="u-mb-8">
        <h2 className="u-text-xl u-font-bold u-mb-4">Applications</h2>
        <Grid>
          {quickActions.map((action) => (
            <GridCol xs={12} sm={6} lg={3} key={action.href}>
              <Link href={action.href} className="u-text-decoration-none">
                <Card className="u-h-100 u-cursor-pointer u-transition-all u-duration-200 hover:u-scale-105 hover:u-shadow-lg">
                  <div className="u-flex u-items-start u-gap-3">
                    <div className={`u-bg-${action.color}-subtle u-rounded u-p-3`}>
                      <Icon
                        name={action.icon}
                        className={`u-text-${action.color}`}
                        size="lg"
                      />
                    </div>
                    <div className="u-flex-grow-1">
                      <h3 className="u-text-base u-font-bold u-mb-1">{action.title}</h3>
                      <p className="u-text-sm u-text-secondary-emphasis u-mb-0">
                        {action.description}
                      </p>
                    </div>
                    <Icon name="ArrowRight" className="u-text-secondary-emphasis" />
                  </div>
                </Card>
              </Link>
            </GridCol>
          ))}
        </Grid>
      </div>

      <div>
        <div className="u-flex u-justify-between u-items-center u-mb-4">
          <h2 className="u-text-xl u-font-bold u-mb-0">Activity feed</h2>
          <Link href="/dashboard" className="u-text-decoration-none">
            <Button variant="outline-secondary" size="sm">
              View dashboard
            </Button>
          </Link>
        </div>
        <Card>
          <div className="u-flex u-flex-column u-gap-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="u-flex u-items-start u-gap-3 u-py-2 u-border-bottom u-border-secondary-subtle u-last:border-none"
              >
                <div
                  className={`u-bg-${activity.severity}-subtle u-rounded-circle u-p-2 u-mt-1`}
                >
                  <Icon
                    name={
                      activity.type === "incident"
                        ? "Warning"
                        : activity.type === "workorder"
                          ? "Clipboard"
                          : activity.type === "maintenance"
                            ? "Wrench"
                            : "CheckCircle"
                    }
                    className={`u-text-${activity.severity}`}
                    size="sm"
                  />
                </div>
                <div className="u-flex-grow-1">
                  <div className="u-text-sm u-font-bold">{activity.message}</div>
                  <div className="u-text-xs u-text-secondary-emphasis">
                    {activity.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
