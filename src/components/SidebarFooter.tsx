"use client";

import Link from "next/link";
import { ColorModeToggle, Icon } from "@shohojdhara/atomix";
import { useVisibility } from "../hooks/useVisibility";

export function SidebarFooter() {
  const { visible: showShortcuts, toggle: toggleShortcuts } = useVisibility();

  return (
    <div className="u-flex u-flex-column u-gap-3 u-pt-3 u-border-top">
      {/* Quick Actions Section */}
      <div className="u-flex u-flex-column u-gap-2">
        <button
          className="u-w-100 u-px-3 u-py-2 u-bg-transparent u-border-none u-cursor-pointer u-text-left u-flex u-items-center u-gap-2 u-rounded u-transition-all hover:u-bg-secondary-subtle"
          onClick={toggleShortcuts}
          aria-expanded={showShortcuts}
          aria-label="Toggle keyboard shortcuts"
        >
          <Icon name="Keyboard" size="sm" className="u-text-secondary-emphasis" />
          <span className="u-text-sm u-font-medium u-text-secondary">Shortcuts</span>
          <Icon
            name={`Caret${showShortcuts ? "Up" : "Down"}`}
            size="xs"
            className="u-ml-auto u-text-secondary-emphasis"
          />
        </button>

        {showShortcuts && (
          <div className="u-flex u-flex-column u-gap-1 u-px-3 u-py-2 u-bg-secondary-subtle u-rounded u-animate-slide-down">
            <div className="u-flex u-justify-between u-items-center u-text-xs u-text-secondary-emphasis">
              <kbd className="u-px-2 u-py-0.5 u-bg-surface u-border u-rounded-sm u-font-mono u-text-xs">
                ⌘K
              </kbd>
              <span>Quick search</span>
            </div>
            <div className="u-flex u-justify-between u-items-center u-text-xs u-text-secondary-emphasis">
              <kbd className="u-px-2 u-py-0.5 u-bg-surface u-border u-rounded-sm u-font-mono u-text-xs">
                ?
              </kbd>
              <span>Show shortcuts</span>
            </div>
            <div className="u-flex u-justify-between u-items-center u-text-xs u-text-secondary-emphasis">
              <kbd className="u-px-2 u-py-0.5 u-bg-surface u-border u-rounded-sm u-font-mono u-text-xs">
                Esc
              </kbd>
              <span>Close panel</span>
            </div>
          </div>
        )}
      </div>

      {/* Theme Toggle - Compact pill style */}
      <div className="u-flex u-items-center u-justify-between u-px-3 u-py-2 u-bg-secondary-subtle u-rounded">
        <div className="u-flex u-items-center u-gap-2">
          <Icon name="Moon" size="sm" className="u-text-secondary-emphasis" />
          <span className="u-text-sm u-font-medium u-text-secondary">Theme</span>
        </div>
        <div className="u-scale-75">
          <ColorModeToggle defaultValue="dark" />
        </div>
      </div>

      {/* Help & Support Links - Compact */}
      <div className="u-flex u-flex-column u-gap-0.5">
        <Link
          href="/help"
          className="u-flex u-items-center u-gap-2 u-px-3 u-py-1.5 u-rounded u-text-secondary u-text-xs u-no-underline u-transition-all hover:u-bg-secondary-subtle"
        >
          <Icon name="Question" size="sm" className="u-text-secondary-emphasis" />
          <span>Help Center</span>
        </Link>
        <Link
          href="/feedback"
          className="u-flex u-items-center u-gap-2 u-px-3 u-py-1.5 u-rounded u-text-secondary u-text-xs u-no-underline u-transition-all hover:u-bg-secondary-subtle"
        >
          <Icon name="ChatCircleText" size="sm" className="u-text-secondary-emphasis" />
          <span>Feedback</span>
        </Link>
        <a
          href="https://github.com/shohojdhara/atomix"
          target="_blank"
          rel="noopener noreferrer"
          className="u-flex u-items-center u-gap-2 u-px-3 u-py-1.5 u-rounded u-text-secondary u-text-xs u-no-underline u-transition-all hover:u-bg-secondary-subtle"
        >
          <Icon name="GithubLogo" size="sm" className="u-text-secondary-emphasis" />
          <span>GitHub</span>
        </a>
      </div>

      {/* Version Info - Single line */}
      <div className="u-flex u-items-center u-justify-center u-gap-1 u-py-1 u-text-xs u-text-secondary-emphasis">
        <span>FiberOps v1.0.0</span>
        <span className="u-opacity-50">•</span>
        <span className="u-opacity-80">Build 2026.04.28</span>
      </div>
    </div>
  );
}
