import { NextRequest } from "next/server";

/** Shared-secret check for /api/cron/* routes — these aren't user sessions. */
export function isAuthorizedCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}
