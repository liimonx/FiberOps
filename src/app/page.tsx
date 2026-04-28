"use client";

import Link from "next/link";
import { Card, Button, Icon, Grid, GridCol } from "@shohojdhara/atomix";

const quickActions = [
  {
    title: "Network Map",
    description: "View and manage fiber infrastructure",
    href: "/network-map",
    icon: "MapPin",
    color: "primary",
  },
  {
    title: "Active Incidents",
    description: "Monitor and resolve network issues",
    href: "/incidents",
    icon: "Warning",
    color: "error",
  },
  {
    title: "Work Orders",
    description: "Track field operations and tasks",
    href: "/work-orders",
    icon: "Clipboard",
    color: "success",
  },
  {
    title: "Asset Management",
    description: "Browse and inspect network assets",
    href: "/assets",
    icon: "Package",
    color: "warning",
  },
];

const recentActivity = [
  {
    id: 1,
    type: "incident",
    message: "Node Alpha outage detected",
    time: "10 minutes ago",
    severity: "error",
  },
  {
    id: 2,
    type: "workorder",
    message: "WO-991 assigned to John Doe",
    time: "25 minutes ago",
    severity: "info",
  },
  {
    id: 3,
    type: "maintenance",
    message: "Scheduled maintenance on Splitter 08",
    time: "2 hours ago",
    severity: "warning",
  },
  {
    id: 4,
    type: "success",
    message: "Customer ONT installation completed",
    time: "3 hours ago",
    severity: "success",
  },
];

export default function Home() {
  return (
    <div className="u-py-6 u-w-100">
      {/* Hero Section */}
      <div className="u-mb-8">
        <h1 className="u-fs-3xl u-font-bold u-mb-2">Welcome to FiberOps</h1>
        <p className="u-text-secondary-subtle u-fs-lg">
          Monitor, manage, and optimize your fiber network operations in real-time.
        </p>
      </div>

      {/* Quick Stats */}
      <Grid className="u-mb-8">
        <GridCol xs={12} sm={6} lg={3}>
          <Card appearance="ghost" glass={true} className="u-h-100">
            <div className="u-flex u-items-center u-gap-3 u-mb-3">
              <div className="u-bg-primary-subtle u-rounded u-p-2">
                <Icon name="Users" className="u-text-primary" size="lg" />
              </div>
              <div>
                <div className="u-fs-xs u-text-secondary-subtle">Total Customers</div>
                <div className="u-fs-xl u-font-bold">12,492</div>
              </div>
            </div>
            <div className="u-fs-xs u-text-success u-flex u-items-center u-gap-1">
              <Icon name="TrendUp" size="sm" />
              <span>+124 this month</span>
            </div>
          </Card>
        </GridCol>

        <GridCol xs={12} sm={6} lg={3}>
          <Card appearance="ghost" glass={true} className="u-h-100">
            <div className="u-flex u-items-center u-gap-3 u-mb-3">
              <div className="u-bg-error-subtle u-rounded u-p-2">
                <Icon name="Warning" className="u-text-error" size="lg" />
              </div>
              <div>
                <div className="u-fs-xs u-text-secondary-subtle">Active Incidents</div>
                <div className="u-fs-xl u-font-bold">3</div>
              </div>
            </div>
            <div className="u-fs-xs u-text-danger u-flex u-items-center u-gap-1">
              <Icon name="TrendDown" size="sm" />
              <span>-1 since yesterday</span>
            </div>
          </Card>
        </GridCol>

        <GridCol xs={12} sm={6} lg={3}>
          <Card appearance="ghost" glass={true} className="u-h-100">
            <div className="u-flex u-items-center u-gap-3 u-mb-3">
              <div className="u-bg-success-subtle u-rounded u-p-2">
                <Icon name="Pulse" className="u-text-success" size="lg" />
              </div>
              <div>
                <div className="u-fs-xs u-text-secondary-subtle">Signal Health</div>
                <div className="u-fs-xl u-font-bold">94%</div>
              </div>
            </div>
            <div className="u-fs-xs u-text-secondary-subtle">Stable across all nodes</div>
          </Card>
        </GridCol>

        <GridCol xs={12} sm={6} lg={3}>
          <Card appearance="ghost" glass={true} className="u-h-100">
            <div className="u-flex u-items-center u-gap-3 u-mb-3">
              <div className="u-bg-warning-subtle u-rounded u-p-2">
                <Icon name="Clipboard" className="u-text-warning" size="lg" />
              </div>
              <div>
                <div className="u-fs-xs u-text-secondary-subtle">Open Work Orders</div>
                <div className="u-fs-xl u-font-bold">28</div>
              </div>
            </div>
            <div className="u-fs-xs u-text-warning">5 high priority</div>
          </Card>
        </GridCol>
      </Grid>

      {/* Quick Actions */}
      <div className="u-mb-8">
        <h2 className="u-fs-xl u-font-bold u-mb-4">Quick Actions</h2>
        <Grid>
          {quickActions.map((action) => (
            <GridCol xs={12} sm={6} lg={3} key={action.href}>
              <Link href={action.href} className="u-text-decoration-none">
                <Card
                  appearance="ghost"
                  glass={true}
                  className="u-h-100 u-cursor-pointer u-transition-all u-duration-200 hover:u-scale-105 hover:u-shadow-lg"
                >
                  <div className="u-flex u-items-start u-gap-3">
                    <div className={`u-bg-${action.color}-subtle u-rounded u-p-3`}>
                      <Icon
                        name={action.icon as any}
                        className={`u-text-${action.color}`}
                        size="lg"
                      />
                    </div>
                    <div className="u-flex-grow-1">
                      <h3 className="u-fs-base u-font-bold u-mb-1">{action.title}</h3>
                      <p className="u-fs-sm u-text-secondary-subtle u-mb-0">
                        {action.description}
                      </p>
                    </div>
                    <Icon name="ArrowRight" className="u-text-secondary-subtle" />
                  </div>
                </Card>
              </Link>
            </GridCol>
          ))}
        </Grid>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="u-fs-xl u-font-bold u-mb-4">Recent Activity</h2>
        <Card appearance="ghost" glass={true}>
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
                  <div className="u-fs-sm u-font-bold">{activity.message}</div>
                  <div className="u-fs-xs u-text-secondary-subtle">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="u-mt-4 u-text-center">
            <Button variant="outline-secondary" size="sm">
              View All Activity
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
