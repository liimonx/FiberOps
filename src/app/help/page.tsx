"use client";

import { Badge, Button, Card, Container, Grid, GridCol, Icon } from "@shohojdhara/atomix";
import Link from "next/link";

export default function HelpPage() {
  return (
    <Container className="u-p-6 u-max-w-4xl">
      <div className="u-mb-8">
        <h1 className="u-text-3xl u-font-bold u-mb-3">Help Center</h1>
        <p className="u-text-secondary-emphasis u-text-lg">
          Welcome to FiberOps! This comprehensive help center guides you through all features 
          of our telecom network operations dashboard.
        </p>
      </div>

      <Grid className="u-mb-6">
        <GridCol xs={12}>
          <Card title="Getting Started" appearance="outlined">
            <p className="u-text-secondary-emphasis u-mb-4">
              Learn the basics of navigating FiberOps and understanding the dashboard layout.
            </p>
            <div className="u-grid u-grid-cols-1 sm:u-grid-cols-2 u-gap-4">
              <HelpItem 
                icon="House"
                title="Dashboard Overview"
                description="The Home page provides an operations center with key metrics, quick links, and activity feed showing recent network events."
              />
              <HelpItem 
                icon="List"
                title="Navigation"
                description="Use the sidebar to access all modules: Network Map, Assets, Customers, Incidents, Work Orders, Planning, Reports, and Settings."
              />
              <HelpItem 
                icon="AppWindow"
                title="Quick Access"
                description="The app launcher (accessible from Home) provides quick access to core modules with badge notifications for active items."
              />
              <HelpItem 
                icon="Keyboard"
                title="Keyboard Shortcuts"
                description="Press Ctrl/Cmd + B to toggle the sidebar collapse state for better screen real estate management."
              />
            </div>
          </Card>
        </GridCol>
      </Grid>

      <Grid className="u-mb-6">
        <GridCol xs={12} lg={6}>
          <Card title="Network Map" appearance="outlined">
            <p className="u-text-secondary-emphasis u-mb-4">
              Explore your fiber network infrastructure with our interactive GIS canvas.
            </p>
            <div className="u-flex u-flex-column u-gap-3">
              <HelpItem 
                icon="MapPin"
                title="Interactive Map"
                description="Navigate the full-viewport GIS canvas to visualize fiber routes, poles, junction boxes, splitters, ONUs, POPs, and customer connections."
              />
              <HelpItem 
                icon="Stack"
                title="Layer Controls"
                description="Toggle visibility of different network layers using the layer controls panel. Each layer shows statistics including alert counts."
              />
              <HelpItem 
                icon="MagnifyingGlass"
                title="Asset Search"
                description="Search for specific assets by ID, type, or location using the search functionality in the map interface."
              />
              <HelpItem 
                icon="GitBranch"
                title="Route Tracing"
                description="Trace connection paths between any two points in your network to understand signal flow and identify potential issues."
              />
              <HelpItem 
                icon="Ruler"
                title="Measurement Tools"
                description="Use built-in measurement tools to calculate distances, areas, and plan new route installations."
              />
              <HelpItem 
                icon="Fire"
                title="Heat Maps"
                description="Visualize network performance, utilization, and incident density using configurable heat map overlays."
              />
            </div>
          </Card>
        </GridCol>
        <GridCol xs={12} lg={6}>
          <Card title="Assets Management" appearance="outlined">
            <p className="u-text-secondary-emphasis u-mb-4">
              Manage your physical network inventory including cabinets, splitters, and passive plant equipment.
            </p>
            <div className="u-flex u-flex-column u-gap-3">
              <HelpItem 
                icon="Package"
                title="Asset Inventory"
                description="View and manage your complete asset inventory with detailed information about each component's specifications and status."
              />
              <HelpItem 
                icon="PlusCircle"
                title="Asset Registration"
                description="Register new assets directly through the interface with support for bulk imports and detailed metadata capture."
              />
              <HelpItem 
                icon="Calendar"
                title="Maintenance Timeline"
                description="Track maintenance history and schedule future maintenance activities for each asset with automated reminders."
              />
              <HelpItem 
                icon="Graph"
                title="Connection Graphs"
                description="Visualize how assets are interconnected with detailed connection graphs showing capacity utilization and signal health."
              />
            </div>
          </Card>
        </GridCol>
      </Grid>

      <Grid className="u-mb-6">
        <GridCol xs={12} lg={6}>
          <Card title="Customer Management" appearance="outlined">
            <p className="u-text-secondary-emphasis u-mb-4">
              Manage subscriber accounts, service plans, and monitor customer connection health.
            </p>
            <div className="u-flex u-flex-column u-gap-3">
              <HelpItem 
                icon="User"
                title="Customer Profiles"
                description="Access detailed customer profiles including service plans, installation dates, and contact information."
              />
              <HelpItem 
                icon="WifiHigh"
                title="Signal Health Monitoring"
                description="Monitor real-time signal health metrics for each customer connection with alerts for degradation or outages."
              />
              <HelpItem 
                icon="Path"
                title="Connection Path Tracing"
                description="Trace the complete path from customer premises to network backbone to identify potential failure points."
              />
              <HelpItem 
                icon="ClockCounterClockwise"
                title="Incident History"
                description="View historical incident data for each customer to identify recurring issues and service patterns."
              />
            </div>
          </Card>
        </GridCol>
        <GridCol xs={12} lg={6}>
          <Card title="Incident Management" appearance="outlined">
            <p className="u-text-secondary-emphasis u-mb-4">
              Track, manage, and resolve network incidents and outages efficiently.
            </p>
            <div className="u-flex u-flex-column u-gap-3">
              <HelpItem 
                icon="Warning"
                title="Severity Filtering"
                description="Filter incidents by severity level (Critical, High, Medium, Low) to prioritize response efforts."
              />
              <HelpItem 
                icon="MapTrifold"
                title="Map Previews"
                description="View incident locations directly on the network map with visual indicators showing impact areas."
              />
              <HelpItem 
                icon="Timer"
                title="Status Timelines"
                description="Track incident resolution progress with detailed status timelines showing all actions taken."
              />
              <HelpItem 
                icon="CheckCircle"
                title="Report & Resolve Flows"
                description="Use standardized workflows to report new incidents and document resolution steps for compliance and auditing."
              />
            </div>
          </Card>
        </GridCol>
      </Grid>

      <Grid className="u-mb-6">
        <GridCol xs={12} lg={6}>
          <Card title="Work Orders" appearance="outlined">
            <p className="u-text-secondary-emphasis u-mb-4">
              Coordinate field team activities with comprehensive work order management.
            </p>
            <div className="u-flex u-flex-column u-gap-3">
              <HelpItem 
                icon="Kanban"
                title="Kanban Board View"
                description="Manage work orders using the intuitive Kanban board with drag-and-drop functionality for status updates."
              />
              <HelpItem 
                icon="Table"
                title="Table View"
                description="Switch to table view for detailed filtering, sorting, and bulk operations on work orders."
              />
              <HelpItem 
                icon="Pencil"
                title="Full CRUD Operations"
                description="Create, read, update, and delete work orders with comprehensive field validation and audit trails."
              />
              <HelpItem 
                icon="Link"
                title="Deep Links & Cross-References"
                description="Link work orders to specific incidents, assets, and customers for complete context and traceability."
              />
            </div>
          </Card>
        </GridCol>
        <GridCol xs={12} lg={6}>
          <Card title="Planning" appearance="outlined">
            <p className="u-text-secondary-emphasis u-mb-4">
              Plan network expansion, capacity upgrades, and new service deployments.
            </p>
            <div className="u-flex u-flex-column u-gap-3">
              <HelpItem 
                icon="FileText"
                title="Expansion Proposals"
                description="Create detailed expansion proposals with cost estimates, timelines, and resource requirements."
              />
              <HelpItem 
                icon="CurrencyDollar"
                title="Budget Tracking"
                description="Monitor proposal budgets against actual costs with real-time tracking and variance analysis."
              />
              <HelpItem 
                icon="CalendarBlank"
                title="Timeline Management"
                description="Manage project timelines with Gantt-style views showing dependencies and critical path analysis."
              />
              <HelpItem 
                icon="Pen"
                title="Map Drawing Modes"
                description="Use specialized drawing modes in the network map to design proposed routes and infrastructure additions."
              />
            </div>
          </Card>
        </GridCol>
      </Grid>

      <Grid className="u-mb-6">
        <GridCol xs={12} lg={6}>
          <Card title="Reports" appearance="outlined">
            <p className="u-text-secondary-emphasis u-mb-4">
              Generate comprehensive analytics and operational reports for stakeholders.
            </p>
            <div className="u-flex u-flex-column u-gap-3">
              <HelpItem 
                icon="SquaresFour"
                title="Summary Dashboards"
                description="Access pre-built summary dashboards showing key operational metrics and KPIs."
              />
              <HelpItem 
                icon="ChartLine"
                title="Incident Analytics"
                description="Analyze incident patterns, root causes, and resolution times to improve network reliability."
              />
              <HelpItem 
                icon="ChartBar"
                title="Uptime Metrics"
                description="Monitor network uptime and availability metrics with historical trends and SLA compliance reporting."
              />
              <HelpItem 
                icon="Download"
                title="Export History"
                description="Export reports in multiple formats (PDF, CSV, Excel) with complete export history tracking."
              />
            </div>
          </Card>
        </GridCol>
        <GridCol xs={12} lg={6}>
          <Card title="Settings" appearance="outlined">
            <p className="u-text-secondary u-mb-4">
              Configure organization preferences, team management, and system integrations.
            </p>
            <div className="u-flex u-flex-column u-gap-3">
              <HelpItem 
                icon="Buildings"
                title="Organization Settings"
                description="Manage company information, branding, and global system preferences."
              />
              <HelpItem 
                icon="UsersThree"
                title="Team Management"
                description="Add, remove, and configure team member permissions and roles with granular access controls."
              />
              <HelpItem 
                icon="PlugsConnected"
                title="Integrations"
                description="Connect FiberOps with external systems like ticketing platforms, monitoring tools, and CRM systems."
              />
              <HelpItem 
                icon="CreditCard"
                title="Billing Management"
                description="Configure billing settings, payment methods, and subscription management."
              />
            </div>
          </Card>
        </GridCol>
      </Grid>

      <Grid>
        <GridCol xs={12}>
          <Card title="Support & Troubleshooting" appearance="outlined">
            <p className="u-text-secondary-emphasis u-mb-4">
              Get help when you need it and troubleshoot common issues.
            </p>
            
            <div className="u-bg-warning  u-p-4 u-rounded u-mb-4">
              <h3 className="u-text-lg u-font-semibold u-mb-2 u-m-0">
                <Icon name="WarningCircle" className="u-mr-2" />
                Need Immediate Assistance?
              </h3>
              <p className="u-mb-3">
                For urgent issues affecting network operations, contact your administrator immediately.
              </p>
              <Button 
                variant="warning" 
                size="sm"
                href="mailto:admin@fiberops.example.com"
              >
                <Icon name="Envelope" className="u-mr-2" />
                Contact Administrator
              </Button>
            </div>
            
            <div className="u-flex u-flex-column u-gap-3">
              <HelpItem 
                icon="Wrench"
                title="Common Issues"
                description="Check our troubleshooting guide for solutions to common configuration and performance issues."
              />
              <HelpItem 
                icon="DeviceMobile"
                title="Browser Compatibility"
                description="FiberOps is optimized for modern browsers. For best performance, use Chrome, Firefox, or Edge latest versions."
              />
              <HelpItem 
                icon="Rocket"
                title="Performance Optimization"
                description="For large networks, consider adjusting map layer visibility and using filtered views to improve performance."
              />
            </div>
          </Card>
        </GridCol>
      </Grid>

      <div className="u-mt-8 u-pt-6 u-border-top u-border-secondary-subtle u-text-center">
        <p className="u-text-secondary-emphasis">
          FiberOps v0.1.0 • Production-grade telecom network operations dashboard
        </p>
        <p className="u-text-secondary-emphasis u-text-sm u-mt-2">
          This is a demo deployment. For production support, contact your system administrator.
        </p>
      </div>
    </Container>
  );
}

// Reusable Help Item Component with icons
function HelpItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="u-flex u-items-start u-gap-3">
      <div className="u-rounded-circle u-bg-primary-subtle u-text-primary u-p-2 u-mt-1">
        <Icon name={icon as any} size={16} />
      </div>
      <div>
        <h4 className="u-text-base u-font-semibold u-mb-1 u-m-0">{title}</h4>
        <p className="u-text-secondary-emphasis u-text-sm u-m-0">{description}</p>
      </div>
    </div>
  );
}