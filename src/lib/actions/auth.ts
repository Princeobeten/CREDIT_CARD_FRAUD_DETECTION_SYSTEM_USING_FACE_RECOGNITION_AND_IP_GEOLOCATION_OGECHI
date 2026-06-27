"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createUser, authenticateUser, emailExists } from "@/lib/auth/users";
import { createSession, deleteSession } from "@/lib/session";
import { HOME_BY_ROLE, ROLES } from "@/lib/types";

export interface AuthState {
  errors?: Record<string, string[]>;
  message?: string;
}

const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name"),
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(ROLES),
});

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export async function registerAction(
  _prev: AuthState | undefined,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  if (await emailExists(parsed.data.email)) {
    return { errors: { email: ["An account with this email already exists"] } };
  }

  const user = await createUser(parsed.data);
  await createSession(user.id, user.role);
  redirect(HOME_BY_ROLE[user.role]);
}

export async function loginAction(
  _prev: AuthState | undefined,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const user = await authenticateUser(parsed.data.email, parsed.data.password);
  if (!user) {
    return { errors: { email: ["Invalid email or password"] } };
  }

  await createSession(user.id, user.role);
  redirect(HOME_BY_ROLE[user.role]);
}

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
