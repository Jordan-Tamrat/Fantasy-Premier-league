import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { prisma } from "@/lib/prisma";
import { FPLService } from "@/lib/fpl";
import { closePayments, markGameWeekLive, markResultsPending } from "@/services/gameWeekLifecycle";
import { lockGameWeek } from "@/services/lockGameWeek";
import { resolveDueProposals } from "@/services/proposalService";

// Advances every Game Week through its lifecycle based on real-world time and
// FPL state — payment deadline passed, FPL deadline passed, FPL confirmed
// final scores. Idempotent: each transition only fires from the specific
// prior status, so running this twice in a row is harmless.
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results: string[] = [];

  const dueForClose = await prisma.gameWeek.findMany({
    where: { status: "OPEN", paymentDeadline: { lte: now } },
  });
  for (const gw of dueForClose) {
    await closePayments(gw.id);
    await lockGameWeek(gw.id, { label: "SYSTEM_CRON" });
    results.push(`${gw.id}: OPEN -> PAYMENT_CLOSED -> locked`);
  }

  const dueForLive = await prisma.gameWeek.findMany({
    where: { status: "LOCKED", fplDeadline: { lte: now } },
  });
  for (const gw of dueForLive) {
    await markGameWeekLive(gw.id);
    results.push(`${gw.id}: LOCKED -> LIVE`);
  }

  const liveGameWeeks = await prisma.gameWeek.findMany({ where: { status: "LIVE" } });
  if (liveGameWeeks.length > 0) {
    const bootstrap = await FPLService.getBootstrapData({ force: true }).catch(() => null);
    if (bootstrap) {
      for (const gw of liveGameWeeks) {
        const event = bootstrap.events.find((e) => e.id === gw.fplEventId);
        if (event?.data_checked) {
          await markResultsPending(gw.id);
          results.push(`${gw.id}: LIVE -> RESULTS_PENDING`);
        }
      }
    }
  }

  // Proposals whose voting deadline has passed get tallied and closed here
  // too, so there's only one scheduled job to keep an eye on.
  const resolvedProposals = await resolveDueProposals();

  return NextResponse.json({ ok: true, transitions: results, resolvedProposals });
}
