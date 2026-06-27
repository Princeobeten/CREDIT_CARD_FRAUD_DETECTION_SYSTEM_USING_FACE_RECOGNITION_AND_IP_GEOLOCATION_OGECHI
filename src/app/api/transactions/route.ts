import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/dal";
import { clientIpFromHeaders } from "@/lib/geo/locate";
import { assessTransaction } from "@/lib/transactions";
import { MERCHANT_CATEGORIES } from "@/lib/constants";

// Give the serverless function headroom for the cold DB connection + geolocation fetch.
export const maxDuration = 30;

const bodySchema = z.object({
  amount: z.number().positive().max(10_000_000),
  merchantCategory: z
    .string()
    .refine((c) => (MERCHANT_CATEGORIES as readonly string[]).includes(c), "Unknown merchant category"),
  faceDescriptor: z.array(z.number()).length(128).optional(),
  testIp: z.string().trim().optional(), // demo aid: simulate the originating IP
});

export async function POST(request: NextRequest) {
  // Re-verify auth + role inside the handler (page gating doesn't protect endpoints).
  const session = await getSession();
  if (!session) return new Response(null, { status: 401 });
  if (session.role !== "cardholder") return new Response(null, { status: 403 });

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 422 },
    );
  }

  const ip = parsed.data.testIp || clientIpFromHeaders(request.headers);

  try {
    const result = await assessTransaction(session.userId, {
      amount: parsed.data.amount,
      merchantCategory: parsed.data.merchantCategory,
      ip,
      faceDescriptor: parsed.data.faceDescriptor,
    });
    return NextResponse.json(result);
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Assessment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
