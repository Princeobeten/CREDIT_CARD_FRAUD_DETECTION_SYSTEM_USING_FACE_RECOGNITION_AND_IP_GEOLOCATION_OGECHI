import Link from "next/link";
import type { ReactNode } from "react";
import type { Role } from "@/lib/types";
import NavLinks, { type NavItem } from "@/components/NavLinks";
import LogoutButton from "@/components/LogoutButton";

const ROLE_LABEL: Record<Role, string> = {
  cardholder: "Cardholder",
  analyst: "Fraud Analyst",
  admin: "Administrator",
};

export default function DashboardShell({
  role,
  fullName,
  nav,
  children,
}: {
  role: Role;
  fullName: string;
  nav: NavItem[];
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href={nav[0]?.href ?? "/"} className="text-lg font-semibold tracking-tight">
              Fraud<span className="text-brand">Guard</span>
            </Link>
            <NavLinks items={nav} />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{fullName}</p>
              <p className="text-xs text-muted">{ROLE_LABEL[role]}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
