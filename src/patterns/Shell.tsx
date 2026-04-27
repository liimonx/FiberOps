"use client";

import Link from "next/link";
import styles from "./Shell.module.css";
import {
  Badge,
  Card,
  Navbar,
  Nav,
  NavItem,
  SideMenu,
  SideMenuItem,
  SideMenuList,
  ColorModeToggle,
} from "@shohojdhara/atomix";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/network-map", label: "Network Map" },
  { href: "/assets", label: "Assets" },
  { href: "/customers", label: "Customers" },
  { href: "/incidents", label: "Incidents" },
  { href: "/work-orders", label: "Work Orders" },
  { href: "/planning", label: "Planning" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.root}>
      <Navbar
        variant="brand"
        brand={
          <div className={styles.brand}>
            BCN FiberOps <Badge variant="info" label="Mocked" />
          </div>
        }
      >
        <Nav alignment="end">
          {nav.slice(0, 4).map((item) => (
            <NavItem key={item.href} href={item.href} linkComponent={Link}>
              {item.label}
            </NavItem>
          ))}
          <ColorModeToggle defaultValue="dark" />
        </Nav>
      </Navbar>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <SideMenu title="Modules">
            <SideMenuList>
              {nav.map((item) => (
                <SideMenuItem key={item.href} href={item.href} linkComponent={Link}>
                  {item.label}
                </SideMenuItem>
              ))}
            </SideMenuList>
          </SideMenu>
        </aside>

        <main className={styles.main}>{children}</main>

        <aside className={styles.inspector}>
          <Card
            appearance="outlined"
            title="Inspector"
            text="Select an asset to inspect."
          />
        </aside>
      </div>

      <footer className={styles.activity}>
        <Card appearance="ghost" title="Activity" text="No events." />
      </footer>
    </div>
  );
}
