"use client";

import {
  Card,
  Container,
  Grid,
  GridCol,
  Badge,
  Button,
  Avatar,
  Icon,
} from "@shohojdhara/atomix";

const kanbanData = {
  New: [{ id: "WO-995", title: "Site Survey - Oak St", priority: "Low", type: "Survey" }],
  Assigned: [
    { id: "WO-994", title: "Signal Auditing", priority: "Medium", type: "Audit" },
  ],
  "In Progress": [
    { id: "WO-991", title: "Splice Repair", priority: "Critical", type: "Repair" },
  ],
  Review: [
    { id: "WO-989", title: "Node Beta Upgrades", priority: "High", type: "Upgrade" },
  ],
  Done: [
    { id: "WO-980", title: "Drop Cable Install", priority: "Medium", type: "Install" },
    { id: "WO-979", title: "Customer Router Setup", priority: "Low", type: "Setup" },
  ],
};

export default function WorkOrdersPage() {
  const renderCard = (task: any) => {
    let badgeVariant: "danger" | "warning" | "success" | "secondary" = "secondary";
    if (task.priority === "Critical") badgeVariant = "danger";
    if (task.priority === "High") badgeVariant = "warning";
    if (task.priority === "Medium") badgeVariant = "success";

    return (
      <Card
        key={task.id}
        appearance="elevated"
        className="u-mb-3 u-cursor-pointer u-border u-border-secondary-subtle"
      >
        <div className="u-flex u-justify-between u-items-start u-mb-2">
          <Badge variant="secondary" label={task.priority} />
          <Icon name="ThreeDots" className="u-text-secondary-subtle" />
        </div>
        <h4 className="u-fs-base u-font-bold u-mb-1">{task.title}</h4>
        <div className="u-flex u-justify-between u-items-center u-mt-4">
          <span className="u-font-mono u-fs-xs u-text-secondary-subtle">{task.id}</span>
          <Avatar initials={task.type} size="sm" />
        </div>
      </Card>
    );
  };

  return (
    <Container className="u-py-4 u-w-100" type="fluid">
      <div className="u-flex u-justify-between u-items-center u-mb-6">
        <div>
          <h1 className="u-fs-2xl u-font-bold u-mb-2">Work Orders</h1>
          <p className="u-text-secondary-subtle u-fs-sm">
            Drag-and-drop Kanban board for managing field operations.
          </p>
        </div>
        <div className="u-flex u-gap-4">
          <Button variant="outline-secondary" iconName="funnel">
            Filter
          </Button>
          <Button variant="primary" iconName="plus">
            New Order
          </Button>
        </div>
      </div>

      <Grid className="u-mb-6">
        {Object.entries(kanbanData).map(([column, tasks]) => (
          <GridCol xs={12} sm={6} lg={2} key={column} className="u-flex-grow-1">
            <div className="u-bg-dark u-p-3 u-rounded u-h-100 u-border u-border-secondary-subtle">
              <div className="u-flex u-justify-between u-items-center u-mb-4">
                <h3 className="u-font-bold u-fs-base">{column}</h3>
                <Badge variant="secondary" label={String(tasks.length)} />
              </div>

              <div
                className="u-flex u-flex-column u-h-100"
                style={{ minHeight: "400px" }}
              >
                {tasks.map(renderCard)}
              </div>
            </div>
          </GridCol>
        ))}
      </Grid>
    </Container>
  );
}
