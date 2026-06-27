import type { ReactNode } from "react";
import { requireRole } from "@/lib/dal";
import { getUserById } from "@/lib/auth/users";
import DashboardShell from "@/components/DashboardShell";
import type { NavItem } from "@/components/NavLinks";

const NAV: NavItem[] = [
  { href: "/cardholder", label: "Overview" },
  { href: "/cardholder/enroll", label: "Enrollment" },
  { href: "/cardholder/pay", label: "New Transaction" },
  { href: "/cardholder/transactions", label: "History" },
];

export default async function CardholderLayout({ children }: { children: ReactNode }) {
  const session = await requireRole("cardholder");
  const user = await getUserById(session.userId);
  return (
    <DashboardShell role="cardholder" fullName={user?.fullName ?? "Cardholder"} nav={NAV}>
      {children}
    </DashboardShell>
  );
}
