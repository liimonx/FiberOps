"use client";

import React from 'react';
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
    label: 'Find Nodes',
    icon: 'HardDrives',
    onClick: () => {} // Will be overridden by parent
  },
  {
    label: 'Trace Routes',
    icon: 'GitBranch',
    onClick: () => {} // Will be overridden by parent
  }
];

/**
 * Quick action buttons for common search operations
 */
export const QuickActions: React.FC<QuickActionsProps> = ({
  actions = DEFAULT_ACTIONS,
  containerClassName = '',
  labelClassName = '',
  gridClassName = '',
  actionClassName = ''
}) => {
  return (
    <div className={`quick-actions ${containerClassName}`}>
      <span className={`quick-actions-label ${labelClassName}`}>Quick Actions</span>
      <div className={`quick-actions-grid ${gridClassName}`}>
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="secondary"
            size="md"
            iconName={action.icon as any}
            onClick={action.onClick}
            className={`quick-action ${actionClassName}`}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
