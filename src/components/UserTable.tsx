"use client";

import { useState, useTransition } from "react";
import { changeUserRoleAction } from "@/lib/actions/admin";
import { ROLES, type Role } from "@/lib/types";
import type { UserAdminDTO } from "@/lib/admin";

function RoleSelect({ user, isSelf }: { user: UserAdminDTO; isSelf: boolean }) {
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState<Role>(user.role);
  const [error, setError] = useState<string | null>(null);

  function onChange(next: Role) {
    const previous = role;
    setRole(next);
    setError(null);
    startTransition(async () => {
      const res = await changeUserRoleAction({ userId: user.id, role: next });
      if (!res.ok) {
        setRole(previous);
        setError(res.error ?? "Failed");
      }
    });
  }

  return (
    <div>
      <select
        value={role}
        disabled={pending || isSelf}
        onChange={(e) => onChange(e.target.value as Role)}
        className="rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none focus:border-brand disabled:opacity-60"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      {isSelf && <p className="mt-1 text-xs text-muted">(you)</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function UserTable({
  users,
  currentUserId,
}: {
  users: UserAdminDTO[];
  currentUserId: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-background text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Joined</th>
            <th className="px-4 py-3 font-medium">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium">{u.fullName}</td>
              <td className="px-4 py-3 text-muted">{u.email}</td>
              <td className="px-4 py-3 text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <RoleSelect user={u} isSelf={u.id === currentUserId} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
