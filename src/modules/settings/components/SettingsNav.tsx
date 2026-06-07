"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { href: "/settings/general", label: "General" },
  { href: "/settings/integrations", label: "Integrations" },
  { href: "/settings/billing", label: "Billing Settings" },
  { href: "/settings/team", label: "Team & Access" },
] as const;

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav
      className="u-flex u-gap-6 u-border-bottom u-border-secondary-subtle u-mb-6"
      aria-label="Settings sections"
    >
      {sections.map(({ href, label }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            className={`u-pb-3 u-text-sm u-font-bold u-no-underline u-transition-colors ${
              isActive
                ? "u-text-primary u-border-bottom u-border-primary"
                : "u-text-secondary-emphasis"
            }`}
            style={isActive ? { marginBottom: "-1px" } : undefined}
            aria-current={isActive ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
