import Link from "next/link";
import { Card, Icon } from "@shohojdhara/atomix";
import type { PhosphorIconsType } from "@shohojdhara/atomix";

type MetricCardProps = {
  label: string;
  value: string | number;
  icon: PhosphorIconsType;
  iconClassName?: string;
  iconBgClassName?: string;
  footer?: React.ReactNode;
  footerClassName?: string;
  isLoading?: boolean;
  href?: string;
};

function MetricCardContent({
  label,
  value,
  icon,
  iconClassName,
  iconBgClassName = "u-bg-primary-subtle",
  footer,
  footerClassName,
  isLoading = false,
}: MetricCardProps) {
  return (
    <>
      <div className="u-flex u-items-center u-gap-3 u-mb-3">
        <div
          className={`u-metric-card__icon ${iconBgClassName}`}
          aria-hidden="true"
        >
          <Icon name={icon} className={iconClassName} size="lg" />
        </div>
        <div className="u-min-w-0">
          <div className="u-text-xs u-text-secondary-emphasis">{label}</div>
          {isLoading ? (
            <div className="u-skeleton u-h-8 u-w-50 u-mt-1" aria-hidden="true" />
          ) : (
            <div className="u-text-xxl u-font-bold u-leading-tight">{value}</div>
          )}
        </div>
      </div>
      {footer && !isLoading ? (
        <div className={`u-text-xs ${footerClassName ?? ""}`}>{footer}</div>
      ) : null}
      {isLoading ? (
        <div className="u-skeleton u-h-3 u-w-75" aria-hidden="true" />
      ) : null}
    </>
  );
}

export function MetricCard(props: MetricCardProps) {
  const { href, label, isLoading } = props;

  if (href && !isLoading) {
    return (
      <Link href={href} className="u-metric-card-link" aria-label={`View ${label}`}>
        <Card className="u-metric-card u-h-100">
          <MetricCardContent {...props} />
        </Card>
      </Link>
    );
  }

  return (
    <Card className="u-h-100">
      <MetricCardContent {...props} />
    </Card>
  );
}
