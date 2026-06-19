import Link from "next/link";
import { Card, Icon } from "@shohojdhara/atomix";
import type { ActivityFeedItem } from "@/lib/homeActivity";
import { EmptyState } from "@/components/EmptyState";

type ActivityFeedProps = {
  items: ActivityFeedItem[];
};

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <Card>
      {items.length === 0 ? (
        <EmptyState
          icon="Clock"
          title="No recent activity"
          description="Incidents and work orders will appear here as they are created or updated."
        />
      ) : (
        <ul className="u-activity-feed u-list-unstyled u-mb-0">
          {items.map((item) => (
            <li key={item.id} className="u-activity-feed__item">
              <Link href={item.href} className="u-activity-feed__link">
                <span
                  className={`u-activity-feed__icon u-bg-${item.severity}-subtle`}
                  aria-hidden="true"
                >
                  <Icon
                    name={item.icon}
                    className={`u-text-${item.severity}`}
                    size="sm"
                  />
                </span>
                <span className="u-activity-feed__content">
                  <span className="u-activity-feed__message">{item.message}</span>
                  <span className="u-activity-feed__time">{item.time}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
