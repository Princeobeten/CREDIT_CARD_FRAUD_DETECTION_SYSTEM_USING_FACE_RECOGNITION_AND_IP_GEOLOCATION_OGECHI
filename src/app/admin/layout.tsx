import type { ReactNode } from "react";
import { requireRole } from "@/lib/dal";
import { getUserById } from "@/lib/auth/users";
import DashboardShell from "@/components/DashboardShell";
import type { NavItem } from "@/components/NavLinks";

const NAV: NavItem[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/config", label: "Risk Config" },
  { href: "/admin/audit", label: "Audit Log" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireRole("admin");
  const user = await getUserById(session.userId);
  return (
    <DashboardShell role="admin" fullName={user?.fullName ?? "Administrator"} nav={NAV}>
      {children}
    </DashboardShell>
  );
}
