"use client";

import Link from "next/link";
import {
  Button,
  Callout,
  Card,
  Container,
  Grid,
  GridCol,
  Icon,
} from "@shohojdhara/atomix";
import {
  APP_SHORTCUTS,
  GETTING_STARTED_TOPICS,
  MAP_SHORTCUTS,
  MODULE_GUIDES,
  TROUBLESHOOTING_TOPICS,
  type HelpShortcut,
  type HelpTopic,
  type ModuleHelpGuide,
} from "@/lib/helpContent";

const TOC_LINKS = [
  { href: "#getting-started", label: "Getting started", icon: "Rocket" as const },
  { href: "#modules", label: "Modules", icon: "SquaresFour" as const },
  { href: "#shortcuts", label: "Shortcuts", icon: "Keyboard" as const },
  { href: "#support", label: "Support", icon: "Lifebuoy" as const },
] as const;

export default function HelpPage() {
  return (
    <Container className="u-page u-max-w-5xl">
      <header className="u-help-hero">
        <p className="u-help-hero__eyebrow">Documentation</p>
        <h1 className="u-help-hero__title">Help Center</h1>
        <p className="u-help-hero__description">
          Guides for every FiberOps module — from the operations center and GIS
          map to incidents, field work, planning, and reporting. Jump to a section
          below or open a module directly from the cards.
        </p>
        <div
          className="u-home-hero__quick-actions"
          role="navigation"
          aria-label="Help quick actions"
        >
          <Link href="/" className="u-quick-action">
            Back to Home
          </Link>
          <Link href="/network-map" className="u-quick-action">
            Open network map
          </Link>
          <Link href="/incidents" className="u-quick-action u-quick-action--error">
            Report incident
          </Link>
          <Link href="/settings/team" className="u-quick-action">
            Team settings
          </Link>
        </div>
      </header>

      <nav className="u-help-toc" aria-label="On this page">
        {TOC_LINKS.map((link) => (
          <a key={link.href} href={link.href} className="u-help-toc__link">
            <Icon name={link.icon} size="sm" aria-hidden="true" />
            {link.label}
          </a>
        ))}
      </nav>

      <section
        id="getting-started"
        className="u-mb-8"
        aria-labelledby="help-getting-started-heading"
      >
        <h2 id="help-getting-started-heading" className="u-section-heading">
          Getting started
        </h2>
        <Card appearance="outlined">
          <p className="u-text-secondary-emphasis u-mb-4">
            FiberOps is organized around a persistent sidebar, a Home operations
            center, and focused modules for each workflow. Use these starting
            points before diving into module-specific guides.
          </p>
          <div className="u-grid u-grid-cols-1 md:u-grid-cols-2 u-gap-4">
            {GETTING_STARTED_TOPICS.map((topic) => (
              <HelpTopicItem key={topic.title} {...topic} />
            ))}
          </div>
        </Card>
      </section>

      <section
        id="modules"
        className="u-mb-8"
        aria-labelledby="help-modules-heading"
      >
        <h2 id="help-modules-heading" className="u-section-heading">
          Application modules
        </h2>

        <div className="u-launcher-subsection">
          <p className="u-launcher-subsection__title">Core operations</p>
          <Grid>
            {MODULE_GUIDES.core.map((guide) => (
              <GridCol xs={12} lg={6} key={guide.href}>
                <ModuleGuideCard guide={guide} />
              </GridCol>
            ))}
          </Grid>
        </div>

        <div className="u-launcher-subsection">
          <p className="u-launcher-subsection__title">Management & analytics</p>
          <Grid>
            {MODULE_GUIDES.management.map((guide) => (
              <GridCol xs={12} lg={6} key={guide.href}>
                <ModuleGuideCard guide={guide} />
              </GridCol>
            ))}
          </Grid>
        </div>
      </section>

      <section
        id="shortcuts"
        className="u-mb-8"
        aria-labelledby="help-shortcuts-heading"
      >
        <h2 id="help-shortcuts-heading" className="u-section-heading">
          Keyboard shortcuts
        </h2>
        <Grid>
          <GridCol xs={12} lg={6}>
            <Card title="Application" appearance="outlined" className="u-h-100">
              <p className="u-text-secondary-emphasis u-text-sm u-mb-4">
                Global shortcuts work across the shell. Open the shortcuts panel
                from the sidebar footer for a quick reference while you work.
              </p>
              <ShortcutsList shortcuts={APP_SHORTCUTS} />
            </Card>
          </GridCol>
          <GridCol xs={12} lg={6}>
            <Card title="Network map tools" appearance="outlined" className="u-h-100">
              <p className="u-text-secondary-emphasis u-text-sm u-mb-4">
                Tool shortcuts activate from the map view when focus is not in a
                text field. Toolbar buttons show the same key hints.
              </p>
              <ShortcutsList shortcuts={MAP_SHORTCUTS} />
            </Card>
          </GridCol>
        </Grid>
      </section>

      <section
        id="support"
        aria-labelledby="help-support-heading"
      >
        <h2 id="help-support-heading" className="u-section-heading">
          Support & troubleshooting
        </h2>
        <Card appearance="outlined">
          <Callout variant="warning" title="Need immediate assistance?" className="u-mb-4">
            <p className="u-text-sm u-mb-3">
              For urgent outages or production incidents, contact your network
              operations lead or system administrator directly.
            </p>
            <Button
              variant="warning"
              size="sm"
              href="mailto:admin@fiberops.example.com"
              iconName="Envelope"
            >
              Contact administrator
            </Button>
          </Callout>

          <div className="u-grid u-grid-cols-1 md:u-grid-cols-2 u-gap-4">
            {TROUBLESHOOTING_TOPICS.map((topic) => (
              <HelpTopicItem key={topic.title} {...topic} iconTone="secondary" />
            ))}
          </div>
        </Card>
      </section>

      <footer className="u-help-footer">
        <p className="u-text-secondary-emphasis u-mb-1">
          FiberOps v0.1.0 · Telecom network operations dashboard
        </p>
        <p className="u-text-secondary-emphasis u-text-sm u-m-0">
          Demo deployment with mock API data. For production support, contact your
          system administrator.
        </p>
      </footer>
    </Container>
  );
}

function HelpTopicItem({
  icon,
  title,
  description,
  iconTone = "primary",
}: HelpTopic & { iconTone?: "primary" | "secondary" }) {
  const iconClass =
    iconTone === "secondary"
      ? "u-bg-secondary-subtle u-text-secondary-emphasis"
      : "u-bg-primary-subtle u-text-primary";

  return (
    <div className="u-help-topic">
      <div className={`u-help-topic__icon ${iconClass}`} aria-hidden="true">
        <Icon name={icon} size={16} />
      </div>
      <div>
        <h3 className="u-help-topic__title u-m-0">{title}</h3>
        <p className="u-help-topic__description">{description}</p>
      </div>
    </div>
  );
}

function ModuleGuideCard({ guide }: { guide: ModuleHelpGuide }) {
  return (
    <Link href={guide.href} className="u-help-module">
      <Card appearance="outlined" className="u-help-module__card u-h-100">
        <div className="u-help-module__header">
          <div
            className={`u-help-module__icon u-bg-${guide.color}-subtle`}
            aria-hidden="true"
          >
            <Icon name={guide.icon} className={`u-text-${guide.color}`} size="lg" />
          </div>
          <div className="u-min-w-0">
            <h3 className="u-help-module__title u-m-0">{guide.label}</h3>
            <p className="u-help-module__summary">{guide.summary}</p>
          </div>
          <Icon
            name="ArrowRight"
            className="u-text-secondary-emphasis u-flex-shrink-0"
            aria-hidden="true"
          />
        </div>
        <div className="u-help-module__topics">
          {guide.topics.map((topic) => (
            <HelpTopicItem key={topic.title} {...topic} iconTone="secondary" />
          ))}
        </div>
      </Card>
    </Link>
  );
}

function ShortcutsList({ shortcuts }: { shortcuts: HelpShortcut[] }) {
  return (
    <div className="u-help-shortcuts-grid">
      {shortcuts.map((shortcut) => (
        <div key={`${shortcut.keys}-${shortcut.label}`} className="u-help-shortcut-row">
          <div>
            <p className="u-help-shortcut-row__label u-m-0">{shortcut.label}</p>
            {shortcut.context && (
              <span className="u-help-shortcut-row__context">{shortcut.context}</span>
            )}
          </div>
          <kbd className="u-kbd">{shortcut.keys}</kbd>
        </div>
      ))}
    </div>
  );
}
