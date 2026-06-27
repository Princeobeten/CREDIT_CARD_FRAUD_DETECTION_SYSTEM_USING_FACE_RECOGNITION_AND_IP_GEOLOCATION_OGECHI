import type { ReactNode } from "react";
import { requireRole } from "@/lib/dal";
import { getUserById } from "@/lib/auth/users";
import DashboardShell from "@/components/DashboardShell";
import type { NavItem } from "@/components/NavLinks";

const NAV: NavItem[] = [
  { href: "/analyst", label: "Overview" },
  { href: "/analyst/alerts", label: "Fraud Alerts" },
];

export default async function AnalystLayout({ children }: { children: ReactNode }) {
  const session = await requireRole("analyst");
  const user = await getUserById(session.userId);
  return (
    <DashboardShell role="analyst" fullName={user?.fullName ?? "Analyst"} nav={NAV}>
      {children}
    </DashboardShell>
  );
}
