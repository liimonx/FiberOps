"use client";

import { useState } from "react";
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

type Task = {
  id: string;
  title: string;
  priority: string;
  type: string;
};

type KanbanData = Record<string, Task[]>;

const initialKanbanData: KanbanData = {
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
  const [kanbanData, setKanbanData] = useState<KanbanData>(initialKanbanData);
  const [draggedTask, setDraggedTask] = useState<{ task: Task; sourceColumn: string } | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleDragStart = (task: Task, sourceColumn: string) => {
    setDraggedTask({ task, sourceColumn });
  };

  const handleDragOver = (e: React.DragEvent, column: string) => {
    e.preventDefault();
    setDragOverColumn(column);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();
    
    if (!draggedTask) return;

    const { task, sourceColumn } = draggedTask;

    // Don't do anything if dropping in the same column
    if (sourceColumn === targetColumn) {
      setDraggedTask(null);
      setDragOverColumn(null);
      return;
    }

    // Remove from source column
    const updatedData = { ...kanbanData };
    updatedData[sourceColumn] = updatedData[sourceColumn].filter((t) => t.id !== task.id);

    // Add to target column
    updatedData[targetColumn] = [...updatedData[targetColumn], task];

    setKanbanData(updatedData);
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const getPriorityBadgeVariant = (priority: string): "error" | "warning" | "success" | "secondary" => {
    if (priority === "Critical") return "error";
    if (priority === "High") return "warning";
    if (priority === "Medium") return "success";
    return "secondary";
  };

  const renderCard = (task: Task) => {
    const badgeVariant = getPriorityBadgeVariant(task.priority);

    return (
      <Card
        key={task.id}
        appearance="elevated"
        className="u-mb-3 u-cursor-pointer u-border u-border-secondary-subtle u-transition-all u-duration-200"
        draggable
        onDragStart={() => handleDragStart(task, Object.keys(kanbanData).find((col) => kanbanData[col].some((t) => t.id === task.id)) || "")}
        onDragEnd={handleDragEnd}
        role="article"
        aria-grabbed={draggedTask?.task.id === task.id}
        tabIndex={0}
      >
        <div className="u-flex u-justify-between u-items-start u-mb-2">
          <Badge variant={badgeVariant} label={task.priority} />
          <Icon name="DotsThree" className="u-text-secondary-subtle" />
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
          <Button variant="outline-secondary" iconName="Funnel">
            Filter
          </Button>
          <Button variant="primary" iconName="Plus">
            New Order
          </Button>
        </div>
      </div>

      <Grid className="u-mb-6">
        {Object.entries(kanbanData).map(([column, tasks]) => (
          <GridCol xs={12} sm={6} lg={2} key={column} className="u-flex-grow-1">
            <div
              className={`u-bg-dark u-p-3 u-rounded u-h-100 u-border u-transition-all u-duration-200 ${
                dragOverColumn === column ? "u-border-primary u-bg-primary-subtle" : "u-border-secondary-subtle"
              }`}
              onDragOver={(e) => handleDragOver(e, column)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column)}
              role="list"
              aria-label={`${column} work orders`}
            >
              <div className="u-flex u-justify-between u-items-center u-mb-4">
                <h3 className="u-font-bold u-fs-base">{column}</h3>
                <Badge variant="secondary" label={String(tasks.length)} />
              </div>

              <div className="u-flex u-flex-column u-h-100" style={{ minHeight: "400px" }}>
                {tasks.length === 0 ? (
                  <div className="u-text-center u-py-8 u-text-secondary-subtle u-fs-sm">
                    Drop tasks here
                  </div>
                ) : (
                  tasks.map(renderCard)
                )}
              </div>
            </div>
          </GridCol>
        ))}
      </Grid>
    </Container>
  );
}
