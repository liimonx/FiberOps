"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import styles from "./Shell.module.css";
import {
  Badge,
  Button,
  Icon,
  SideMenu,
  SideMenuItem,
  SideMenuList,
} from "@shohojdhara/atomix";
import { SidebarFooter } from "@/components/SidebarFooter";
import { usePersistedBoolean } from "@/hooks/usePersistedBoolean";
import { filterNavigationByRole, sidebarNav } from "@/lib/navigation";
import { useAuthStore } from "@/stores/useAuthStore";

const SIDEBAR_COLLAPSED_KEY = "fiberops:sidebar-collapsed";
const DESKTOP_BREAKPOINT = 1025;

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;
  return (
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT" ||
    target.isContentEditable
  );
}

export function Shell({
  children,
  useMsw = true,
}: {
  children: React.ReactNode;
  useMsw?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    value: sidebarCollapsed,
    toggle: toggleSidebarCollapsed,
    hydrated,
  } = usePersistedBoolean(SIDEBAR_COLLAPSED_KEY, false);

  const visibleNav = useMemo(
    () => filterNavigationByRole(sidebarNav, user?.role),
    [user?.role]
  );

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "b") {
        return;
      }

      if (window.innerWidth < DESKTOP_BREAKPOINT || isEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();
      toggleSidebarCollapsed();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebarCollapsed]);

  const rootClassName = [
    styles.root,
    sidebarCollapsed ? styles.sidebarCollapsed : "",
    hydrated ? "" : styles.noTransition,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClassName}>
      <header className={styles.mobileHeader}>
        <Button
          variant="secondary"
          size="sm"
          iconName={sidebarOpen ? "X" : "List"}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle navigation menu"
        />
        <div className={styles.mobileBrand}>
          BCN FiberOps <Badge variant="info" label={useMsw ? "Mocked" : "Live API"} />
        </div>
      </header>

      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className={styles.body}>
        <aside
          className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}
          aria-label="Main navigation"
          aria-expanded={!sidebarCollapsed}
        >
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarHeaderMain}>
              <div className={styles.brand}>BCN FiberOps</div>
              <Badge variant="info" label={useMsw ? "Mocked" : "Live API"} className={styles.brandBadge} />
            </div>
            <button
              type="button"
              className={styles.collapseToggle}
              onClick={toggleSidebarCollapsed}
              aria-expanded={!sidebarCollapsed}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Icon
                name={sidebarCollapsed ? "CaretRight" : "CaretLeft"}
                size="sm"
                aria-hidden="true"
              />
            </button>
            {user ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  await logout();
                  router.push("/login");
                }}
                aria-label={`Sign out (${user.name})`}
              >
                <Icon name="SignOut" size="sm" aria-hidden="true" />
              </Button>
            ) : null}
          </div>

          <SideMenu>
            <SideMenuList>
              {visibleNav.map((item) => (
                <SideMenuItem
                  key={item.href}
                  href={item.href}
                  linkComponent={Link}
                  className={`${styles.navItem} ${isActive(item.href) ? "is-active" : ""}`}
                  aria-label={sidebarCollapsed ? item.label : undefined}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon name={item.icon} className={styles.navIcon} aria-hidden="true" />
                  <span className={styles.navLabel}>{item.label}</span>
                </SideMenuItem>
              ))}
            </SideMenuList>
          </SideMenu>

          <SidebarFooter collapsed={sidebarCollapsed} />
        </aside>

        <main className={styles.main} id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
