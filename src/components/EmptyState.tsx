"use client";

import { Card, Button, Icon } from "@shohojdhara/atomix";
import type { PhosphorIconsType } from "@shohojdhara/atomix";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: PhosphorIconsType;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon = "Info",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Card className="u-p-8 u-text-center">
      <div className="u-flex u-flex-column u-items-center u-gap-4">
        <div className="u-bg-secondary-subtle u-rounded-circle u-p-4">
          <Icon name={icon} size="xl" className="u-text-secondary-emphasis" />
        </div>
        <div>
          <h3 className="u-text-lg u-font-bold u-mb-2">{title}</h3>
          <p className="u-text-secondary-emphasis u-mb-4">{description}</p>
        </div>
        {actionLabel && onAction && (
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}
