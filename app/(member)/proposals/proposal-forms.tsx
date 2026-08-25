"use client";

import { useActionState, useState, useTransition } from "react";
import { ThumbsUp, ThumbsDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { createProposalAction, castVoteAction, markImplementedAction, resolveProposalNowAction } from "./actions";

export function NewProposalForm() {
  const [open, setOpen] = useState(false);
  const [error, formAction, isPending] = useActionState(createProposalAction, undefined);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="w-full">
        <Plus className="size-4" /> Propose a rule change
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="py-4">
        <form action={formAction} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="e.g. Increase entry fee to 150 ETB" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" required rows={3} placeholder="Explain the change and why." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="votingDeadline">Voting deadline</Label>
            <Input id="votingDeadline" name="votingDeadline" type="datetime-local" required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create proposal"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function VoteButtons({ proposalId, myChoice }: { proposalId: string; myChoice: "YES" | "NO" | null }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <Button
        variant={myChoice === "YES" ? "default" : "outline"}
        size="sm"
        disabled={isPending}
        onClick={() => startTransition(() => void castVoteAction(proposalId, "YES"))}
        className={cn(myChoice === "YES" && "bg-[var(--fpl-green)] text-[var(--fpl-purple)]")}
      >
        <ThumbsUp className="size-3.5" /> Yes
      </Button>
      <Button
        variant={myChoice === "NO" ? "default" : "outline"}
        size="sm"
        disabled={isPending}
        onClick={() => startTransition(() => void castVoteAction(proposalId, "NO"))}
        className={cn(myChoice === "NO" && "bg-[var(--fpl-pink)] text-white")}
      >
        <ThumbsDown className="size-3.5" /> No
      </Button>
    </div>
  );
}

/**
 * Voting normally gets tallied automatically once the deadline passes (see
 * the scheduled job). This is the manual fallback for that — shown only once
 * the deadline has genuinely passed, so it can't be used to cut voting short.
 */
export function ResolveNowButton({ proposalId }: { proposalId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              await resolveProposalNowAction(proposalId);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not resolve this proposal");
            }
          })
        }
      >
        {isPending ? "Resolving…" : "Tally votes now"}
      </Button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function MarkImplementedButton({ proposalId }: { proposalId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() => startTransition(() => void markImplementedAction(proposalId))}
    >
      Mark implemented
    </Button>
  );
}
