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
  className?: string;
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
  className = "",
}) => {
  return (
    <div
      className={`u-p-4 u-bg-white-opacity-5 u-border-top u-border-secondary-subtle ${className}`}
    >
      <span
        className="u-block u-text-xs u-text-secondary-emphasis u-font-bold u-text-uppercase u-mb-3 u-leading-none"
        style={{ letterSpacing: "1px" }}
      >
        Quick Actions
      </span>
      <div className="u-flex u-gap-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            size="sm"
            variant="secondary"
            iconName={action.icon}
            onClick={action.onClick}
            fullWidth
            className="u-transition-all hover:u-shadow-sm"
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
