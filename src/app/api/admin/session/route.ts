import { createHash, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminSession, isAdminRequest, sameOrigin } from "@/lib/admin-session";

const attempts = new Map<string, { count: number; resetAt: number }>();

function equalSecret(input: string, expected: string) {
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function GET() {
  return NextResponse.json({ authenticated: await isAdminRequest() });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const forwarded = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const current = attempts.get(forwarded);
  if (current && current.resetAt > now && current.count >= 5) {
    return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  }

  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || !process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json({ error: "Admin access is not configured." }, { status: 503 });
  }
  if (!body?.email || !body.password || !equalSecret(body.email.toLowerCase(), email.toLowerCase()) || !equalSecret(body.password, password)) {
    attempts.set(forwarded, { count: current && current.resetAt > now ? current.count + 1 : 1, resetAt: now + 15 * 60 * 1000 });
    return NextResponse.json({ error: "Invalid administrator credentials." }, { status: 401 });
  }

  attempts.delete(forwarded);
  (await cookies()).set(ADMIN_COOKIE, createAdminSession(), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict",
    path: "/", maxAge: 8 * 60 * 60, priority: "high",
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  (await cookies()).delete(ADMIN_COOKIE);
  return NextResponse.json({ ok: true });
}

