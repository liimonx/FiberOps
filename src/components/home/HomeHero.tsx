import Link from "next/link";
import { Button } from "@shohojdhara/atomix";

type HomeHeroProps = {
  onRefresh: () => void;
  isRefreshing: boolean;
};

export function HomeHero({ onRefresh, isRefreshing }: HomeHeroProps) {
  return (
    <header className="u-home-hero">
      <div className="u-home-hero__header">
        <div className="u-home-hero__copy">
          <p className="u-home-hero__eyebrow">Network operations</p>
          <h1 className="u-home-hero__title">FiberOps Operations Center</h1>
          <p className="u-home-hero__description">
            Unified visibility and control for fiber infrastructure, field operations,
            and customer service. Use the modules below to monitor health, respond to
            events, and coordinate work across your organization.
          </p>
        </div>
        <div className="u-home-hero__actions">
          <Button
            variant="primary"
            iconName="ArrowsClockwise"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-busy={isRefreshing}
          >
            {isRefreshing ? "Refreshing…" : "Refresh data"}
          </Button>
        </div>
      </div>

      <div className="u-home-hero__quick-actions" role="navigation" aria-label="Quick actions">
        <Link href="/incidents" className="u-quick-action u-quick-action--error">
          Report incident
        </Link>
        <Link href="/dashboard" className="u-quick-action">
          View dashboard
        </Link>
        <Link href="/network-map" className="u-quick-action">
          Open network map
        </Link>
        <Link href="/work-orders" className="u-quick-action">
          Manage work orders
        </Link>
      </div>
    </header>
  );
}
