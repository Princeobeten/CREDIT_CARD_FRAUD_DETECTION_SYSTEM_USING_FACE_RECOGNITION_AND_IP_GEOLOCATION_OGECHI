import "server-only";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import type { Role } from "@/lib/types";

export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export async function createUser(input: {
  email: string;
  password: string;
  fullName: string;
  role: Role;
}): Promise<PublicUser> {
  await connectToDatabase();
  const passwordHash = await bcrypt.hash(input.password, 10);
  const doc = await User.create({
    email: input.email.toLowerCase().trim(),
    passwordHash,
    fullName: input.fullName.trim(),
    role: input.role,
  });
  return { id: doc._id.toString(), email: doc.email, fullName: doc.fullName, role: doc.role };
}

export async function emailExists(email: string): Promise<boolean> {
  await connectToDatabase();
  const existing = await User.exists({ email: email.toLowerCase().trim() });
  return existing != null;
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<PublicUser | null> {
  await connectToDatabase();
  const doc = await User.findOne({ email: email.toLowerCase().trim() });
  if (!doc) return null;
  const ok = await bcrypt.compare(password, doc.passwordHash);
  if (!ok) return null;
  return { id: doc._id.toString(), email: doc.email, fullName: doc.fullName, role: doc.role };
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  await connectToDatabase();
  const doc = await User.findById(id);
  if (!doc) return null;
  return { id: doc._id.toString(), email: doc.email, fullName: doc.fullName, role: doc.role };
}
