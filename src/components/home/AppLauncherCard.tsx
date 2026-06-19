import Link from "next/link";
import { Badge, Card, Icon } from "@shohojdhara/atomix";
import type { LauncherItem } from "@/lib/navigation";

type AppLauncherCardProps = {
  item: LauncherItem;
};

export function AppLauncherCard({ item }: AppLauncherCardProps) {
  return (
    <Link href={item.href} className="u-app-launcher">
      <Card className="u-app-launcher__card u-h-100">
        <div className="u-flex u-items-start u-gap-3">
          <div
            className={`u-app-launcher__icon u-bg-${item.color}-subtle`}
            aria-hidden="true"
          >
            <Icon
              name={item.icon}
              className={`u-text-${item.color}`}
              size="lg"
            />
          </div>
          <div className="u-flex-grow-1 u-min-w-0">
            <div className="u-flex u-items-center u-gap-2 u-mb-1">
              <h3 className="u-app-launcher__title u-mb-0">{item.label}</h3>
              {item.badge !== undefined && item.badge !== 0 && (
                <Badge
                  variant={item.color === "error" ? "error" : "primary"}
                  label={String(item.badge)}
                />
              )}
            </div>
            <p className="u-app-launcher__description">{item.description}</p>
          </div>
          <Icon
            name="ArrowRight"
            className="u-app-launcher__arrow u-text-secondary-emphasis"
            aria-hidden="true"
          />
        </div>
      </Card>
    </Link>
  );
}
