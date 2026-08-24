import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GameWeekStatusBadge } from "@/components/gameweek-status-badge";
import { Countdown } from "@/components/countdown";

export default async function DashboardPage() {
  const user = await requireUser();

  const currentGameWeek = await prisma.gameWeek.findFirst({
    where: { status: { notIn: ["DRAFT", "CANCELLED"] } },
    orderBy: { fplEventId: "desc" },
    include: { prizePositions: { orderBy: { position: "asc" } } },
  });

  const [myPayment, myFplAccount] = currentGameWeek
    ? await Promise.all([
        prisma.payment.findUnique({
          where: { gameWeekId_userId: { gameWeekId: currentGameWeek.id, userId: user.id } },
        }),
        prisma.fPLAccount.findUnique({ where: { userId: user.id } }),
      ])
    : [null, null];

  const participantCount = currentGameWeek
    ? await prisma.payment.count({ where: { gameWeekId: currentGameWeek.id, status: "VERIFIED" } })
    : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-semibold">Welcome, {user.name?.split(" ")[0] ?? "there"} 👋</h1>

      {!currentGameWeek ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No Game Week is open right now. Check back soon.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Game Week {currentGameWeek.fplEventId}</CardTitle>
            <GameWeekStatusBadge status={currentGameWeek.status} />
          </CardHeader>
          <CardContent className="space-y-4">
            {currentGameWeek.status === "OPEN" && (
              <Countdown label="Payment deadline" target={currentGameWeek.paymentDeadline} />
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Entry fee</p>
                <p className="font-medium">{formatMoney(currentGameWeek.entryFee)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Participants</p>
                <p className="font-medium">{participantCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Your payment</p>
                <p className="font-medium">
                  {myPayment ? <PaymentStatusLabel status={myPayment.status} /> : "Not submitted"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">FPL account</p>
                <p className="font-medium">{myFplAccount ? myFplAccount.fplTeamName ?? "Linked" : "Not linked"}</p>
              </div>
            </div>
            <Button
              className="w-full"
              render={<Link href={`/gameweeks/${currentGameWeek.id}`}>View Game Week</Link>}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PaymentStatusLabel({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
    PENDING: { label: "Under review", variant: "secondary" },
    VERIFIED: { label: "Verified ✅", variant: "default" },
    REJECTED: { label: "Rejected", variant: "destructive" },
  };
  const entry = map[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}
