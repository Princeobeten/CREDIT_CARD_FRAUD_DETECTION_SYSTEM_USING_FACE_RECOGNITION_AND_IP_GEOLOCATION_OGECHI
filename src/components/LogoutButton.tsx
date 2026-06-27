import { logoutAction } from "@/lib/actions/auth";

// Server component: a form whose action is the logout Server Action.
export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-background"
      >
        Sign out
      </button>
    </form>
  );
}
