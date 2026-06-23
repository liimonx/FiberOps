"use client";

import Link from "next/link";
import type { PhosphorIconsType } from "@shohojdhara/atomix";
import { ColorModeToggle, Icon } from "@shohojdhara/atomix";
import { useVisibility } from "../hooks/useVisibility";
import styles from "./SidebarFooter.module.css";

interface SidebarFooterProps {
  collapsed?: boolean;
}

const SHORTCUTS = [
  { key: "⌘K", label: "Quick search" },
  { key: "?", label: "Show shortcuts" },
  { key: "Esc", label: "Close panel" },
] as const;

const SECONDARY_LINKS: ReadonlyArray<{
  href: string;
  label: string;
  icon: PhosphorIconsType;
  external?: boolean;
}> = [
  { href: "/help", label: "Help Center", icon: "Question" },
  { href: "/feedback", label: "Feedback", icon: "ChatCircleText" },
  {
    href: "https://github.com/shohojdhara/atomix",
    label: "GitHub",
    icon: "GithubLogo",
    external: true,
  },
];

function ShortcutsPanel({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  return (
    <div
      className={`${styles.shortcutsPanel} ${collapsed ? styles.shortcutsPanelCollapsed : ""} u-animate-slide-down`}
    >
      {SHORTCUTS.map((shortcut) => (
        <div key={shortcut.key} className={styles.shortcutRow}>
          <kbd className={styles.kbd}>{shortcut.key}</kbd>
          <span>{shortcut.label}</span>
        </div>
      ))}
    </div>
  );
}

export function SidebarFooter({ collapsed = false }: SidebarFooterProps) {
  const { visible: showShortcuts, toggle: toggleShortcuts } = useVisibility();

  if (collapsed) {
    return (
      <div className={`${styles.root} ${styles.rootCollapsed}`}>
        <button
          type="button"
          className={`${styles.iconAction} ${showShortcuts ? styles.iconActionActive : ""}`}
          onClick={toggleShortcuts}
          aria-expanded={showShortcuts}
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts"
        >
          <Icon name="Keyboard" size="sm" aria-hidden="true" />
        </button>

        {showShortcuts && <ShortcutsPanel collapsed />}

        <ColorModeToggle
          defaultValue="dark"
          size="sm"
          showTooltip={false}
          className={styles.iconAction}
          aria-label="Toggle color mode"
        />

        <div className={styles.divider} aria-hidden="true" />

        {SECONDARY_LINKS.map((link) => {
          const className = styles.iconAction;
          const icon = <Icon name={link.icon} size="sm" aria-hidden="true" />;

          if (link.external) {
            return (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
                aria-label={link.label}
                title={link.label}
              >
                {icon}
              </a>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              className={className}
              aria-label={link.label}
              title={link.label}
            >
              {icon}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`${styles.root} ${styles.rootExpanded}`}>
      <div className={styles.section}>
        <button
          type="button"
          className={styles.actionRow}
          onClick={toggleShortcuts}
          aria-expanded={showShortcuts}
          aria-label="Toggle keyboard shortcuts"
        >
          <Icon name="Keyboard" size="sm" aria-hidden="true" />
          <span className={styles.actionLabel}>Shortcuts</span>
          <Icon
            name={`Caret${showShortcuts ? "Up" : "Down"}`}
            size="xs"
            className={styles.actionCaret}
            aria-hidden="true"
          />
        </button>

        {showShortcuts && <ShortcutsPanel />}
      </div>

      <div className={styles.themeRow}>
        <div className={styles.themeLabel}>
          <Icon name="Moon" size="sm" aria-hidden="true" />
          <span>Theme</span>
        </div>
        <ColorModeToggle defaultValue="dark" size="sm" showTooltip={false} />
      </div>

      <div className={styles.section}>
        {SECONDARY_LINKS.map((link) => {
          const content = (
            <>
              <Icon name={link.icon} size="sm" aria-hidden="true" />
              <span className={styles.actionLabel}>{link.label}</span>
            </>
          );

          if (link.external) {
            return (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.actionRow}
              >
                {content}
              </a>
            );
          }

          return (
            <Link key={link.href} href={link.href} className={styles.actionRow}>
              {content}
            </Link>
          );
        })}
      </div>

      <div className={styles.meta}>
        <span>FiberOps v1.0.0</span>
        <span className={styles.metaDot} aria-hidden="true">
          •
        </span>
        <span>Build 2026.04.28</span>
      </div>
    </div>
  );
}
