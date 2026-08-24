import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { prisma } from "@/lib/prisma";
import { syncGameWeekScores } from "@/services/fplSyncService";

// Refreshes Game Week scores for every Game Week currently in a state where
// scores matter (LOCKED = about to go live, LIVE = scores changing constantly,
// RESULTS_PENDING = one last sync before an admin finalizes). No-ops if none.
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gameWeeks = await prisma.gameWeek.findMany({
    where: { status: { in: ["LOCKED", "LIVE", "RESULTS_PENDING"] } },
  });

  const summary = [];
  for (const gw of gameWeeks) {
    const result = await syncGameWeekScores(gw.id);
    summary.push({ gameWeekId: gw.id, ...result });
  }

  return NextResponse.json({ ok: true, synced: summary });
}
