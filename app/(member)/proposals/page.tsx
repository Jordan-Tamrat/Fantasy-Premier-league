import { requireUser } from "@/lib/auth";
import { listProposals, tallyVotes } from "@/services/proposalService";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatDateTime, formatDate } from "@/lib/datetime";
import { NewProposalForm, VoteButtons, MarkImplementedButton, ResolveNowButton } from "./proposal-forms";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  OPEN: "default",
  PASSED: "default",
  REJECTED: "destructive",
  IMPLEMENTED: "secondary",
};

export default async function ProposalsPage() {
  const user = await requireUser();
  const proposals = await listProposals();

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight">Rule Proposals</h1>

      <NewProposalForm />

      {proposals.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">No proposals yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {proposals.map((proposal) => {
            const tally = tallyVotes(proposal.votes);
            const myVote = proposal.votes.find((v) => v.userId === user.id);
            const isOpen = proposal.status === "OPEN";
            const deadlinePassed = proposal.votingDeadline <= new Date();

            return (
              <Card key={proposal.id}>
                <CardContent className="space-y-3 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold">{proposal.title}</p>
                      <p className="text-xs text-muted-foreground">
                        by {proposal.author.name} ·{" "}
                        {isOpen
                          ? `voting closes ${formatDateTime(proposal.votingDeadline)}`
                          : `closed ${proposal.resolvedAt ? formatDate(proposal.resolvedAt) : ""}`}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANTS[proposal.status] ?? "secondary"}>{proposal.status}</Badge>
                  </div>

                  <p className="whitespace-pre-wrap text-sm">{proposal.description}</p>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-[var(--fpl-green)]">Yes {tally.yes}</span>
                      <span className="text-muted-foreground">{tally.yesPercent}%</span>
                      <span className="text-[var(--fpl-pink)]">No {tally.no}</span>
                    </div>
                    <Progress value={tally.yesPercent} />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {isOpen ? (
                      <VoteButtons proposalId={proposal.id} myChoice={myVote?.choice ?? null} />
                    ) : (
                      <span className="text-xs text-muted-foreground">Voting closed</span>
                    )}
                    {isOpen && deadlinePassed && user.role === "ADMIN" && (
                      <ResolveNowButton proposalId={proposal.id} />
                    )}
                    {proposal.status === "PASSED" && user.role === "ADMIN" && (
                      <MarkImplementedButton proposalId={proposal.id} />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
