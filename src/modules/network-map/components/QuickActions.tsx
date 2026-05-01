"use client";

import React from "react";
import { Icon, Button } from "@shohojdhara/atomix";

interface QuickAction {
  label: string;
  icon: string;
  onClick: () => void;
}

interface QuickActionsProps {
  actions?: QuickAction[];
  containerClassName?: string;
  labelClassName?: string;
  gridClassName?: string;
  actionClassName?: string;
}

const DEFAULT_ACTIONS: QuickAction[] = [
  {
    label: "Find Nodes",
    icon: "HardDrives",
    onClick: () => {}, // Will be overridden by parent
  },
  {
    label: "Trace Routes",
    icon: "GitBranch",
    onClick: () => {}, // Will be overridden by parent
  },
];

/**
 * Quick action buttons for common search operations
 */
export const QuickActions: React.FC<QuickActionsProps> = ({
  actions = DEFAULT_ACTIONS,
  containerClassName = "",
  labelClassName = "",
  gridClassName = "",
  actionClassName = "",
}) => {
  return (
    <div
      className={`u-p-4 u-border-t u-border-solid u-border-secondary-subtle ${containerClassName}`}
    >
      <span
        className={`u-block u-text-xs u-text-muted u-text-uppercase u-mb-3 ${labelClassName}`}
        style={{ letterSpacing: "0.5px" }}
      >
        Quick Actions
      </span>
      <div className={`u-flex u-gap-2 ${gridClassName}`}>
        {actions.map((action, index) => (
          <Button
            key={index}
            size="sm"
            variant="light"
            iconName={action.icon}
            onClick={action.onClick}
            className={` ${actionClassName}`}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
