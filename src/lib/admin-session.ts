import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "atnurmi_admin";

function signature(expires: string) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return "";
  return createHmac("sha256", secret).update(expires).digest("hex");
}

export function createAdminSession() {
  const expires = String(Date.now() + 8 * 60 * 60 * 1000);
  return `${expires}.${signature(expires)}`;
}

export function verifyAdminSession(value?: string) {
  if (!value) return false;
  const [expires, supplied] = value.split(".");
  if (!expires || !supplied || Number(expires) <= Date.now()) return false;
  const expected = signature(expires);
  if (!expected || supplied.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

export async function isAdminRequest() {
  return verifyAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const expected = new URL(request.url).origin;
  return origin === expected;
}

