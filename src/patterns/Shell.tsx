"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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

const nav = [
  { href: "/", label: "Home", icon: "House" },
  { href: "/dashboard", label: "Dashboard", icon: "SquaresFour" },
  { href: "/network-map", label: "Network Map", icon: "MapPin" },
  { href: "/assets", label: "Assets", icon: "Package" },
  { href: "/customers", label: "Customers", icon: "Users" },
  { href: "/incidents", label: "Incidents", icon: "Warning" },
  { href: "/work-orders", label: "Work Orders", icon: "Clipboard" },
  { href: "/planning", label: "Planning", icon: "Calendar" },
  { href: "/reports", label: "Reports", icon: "ChartBar" },
  { href: "/settings", label: "Settings", icon: "Gear" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className={styles.root}>
      {/* Mobile Header */}
      <header className={styles.mobileHeader}>
        <Button
          variant="secondary"
          size="sm"
          iconName={sidebarOpen ? "X" : "List"}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle navigation menu"
        />
        <div className={styles.mobileBrand}>
          BCN FiberOps <Badge variant="info" label="Mocked" />
        </div>
      </header>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className={styles.body}>
        {/* Sidebar Navigation */}
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
          <div className={styles.sidebarHeader}>
            <div className={styles.brand}>BCN FiberOps</div>
            <Badge variant="info" label="Mocked" />
          </div>

          <SideMenu glass>
            <SideMenuList>
              {nav.map((item) => (
                <SideMenuItem
                  key={item.href}
                  href={item.href}
                  linkComponent={Link}
                  className={`${styles.navItem} ${isActive(item.href) ? styles.navItemActive : ""}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon name={item.icon} className="u-me-2" />
                  <span>{item.label}</span>
                </SideMenuItem>
              ))}
            </SideMenuList>
          </SideMenu>

          <SidebarFooter />
        </aside>

        {/* Main Content Area */}
        <main className={styles.main} id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
