import { requireRole } from "@/lib/dal";
import { listUsers } from "@/lib/admin";
import UserTable from "@/components/UserTable";

export default async function AdminUsersPage() {
  const session = await requireRole("admin");
  const users = await listUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="mt-1 text-muted">Manage accounts and assign roles.</p>
      </div>
      <UserTable users={users} currentUserId={session.userId} />
    </div>
  );
}
