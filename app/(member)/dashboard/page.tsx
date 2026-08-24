import { Coins, Users, Wallet, LinkIcon, CheckCircle2, Clock, XCircle } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { ButtonLink } from "@/components/button-link";
import { Card, CardContent } from "@/components/ui/card";
import { GameWeekHero } from "@/components/gw-hero";
import { StatChip } from "@/components/stat-chip";
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

  const firstName = user.name?.split(" ")[0] ?? "there";

  if (!currentGameWeek) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
        <h1 className="text-2xl font-bold tracking-tight">Hey {firstName} 👋</h1>
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            No Game Week is open right now. Check back soon.
          </CardContent>
        </Card>
      </div>
    );
  }

  const payment = paymentDisplay(myPayment?.status);

  return (
    <div className="mx-auto max-w-2xl">
      <GameWeekHero fplEventId={currentGameWeek.fplEventId} status={currentGameWeek.status} subtitle={`Hey ${firstName} 👋`}>
        {currentGameWeek.status === "OPEN" && (
          <Countdown variant="hero" label="Payment deadline" target={currentGameWeek.paymentDeadline} />
        )}
      </GameWeekHero>

      <div className="relative z-10 -mt-6 space-y-4 px-4 pb-8 md:px-8">
        <div className="grid grid-cols-2 gap-3">
          <StatChip icon={Coins} label="Entry fee" value={formatMoney(currentGameWeek.entryFee)} tone="green" />
          <StatChip icon={Users} label="Participants" value={participantCount} tone="cyan" />
          <StatChip icon={payment.icon} label="Your payment" value={payment.label} tone={payment.tone} />
          <StatChip icon={LinkIcon} label="FPL account" value={myFplAccount?.fplTeamName ?? "Not linked"} />
        </div>

        <ButtonLink href={`/gameweeks/${currentGameWeek.id}`} size="lg" className="w-full font-bold">
          View Game Week
        </ButtonLink>
      </div>
    </div>
  );
}

function paymentDisplay(status: string | undefined) {
  switch (status) {
    case "VERIFIED":
      return { icon: CheckCircle2, label: "Verified", tone: "green" as const };
    case "PENDING":
      return { icon: Clock, label: "Under review", tone: "default" as const };
    case "REJECTED":
      return { icon: XCircle, label: "Rejected", tone: "pink" as const };
    default:
      return { icon: Wallet, label: "Not submitted", tone: "default" as const };
  }
}
