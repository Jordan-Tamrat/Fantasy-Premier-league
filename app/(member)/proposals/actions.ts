"use server";

import { revalidatePath } from "next/cache";
import { requireUser, requireAdmin } from "@/lib/auth";
import { proposalSchema, voteSchema } from "@/lib/validations/phase2.schema";
import { prisma } from "@/lib/prisma";
import { createProposal, castVote, markProposalImplemented, resolveProposal } from "@/services/proposalService";

export async function createProposalAction(_prevState: string | undefined, formData: FormData) {
  const user = await requireUser();
  const parsed = proposalSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    votingDeadline: formData.get("votingDeadline"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";
  if (parsed.data.votingDeadline <= new Date()) return "The voting deadline must be in the future";

  try {
    await createProposal(parsed.data, { userId: user.id });
  } catch (error) {
    return error instanceof Error ? error.message : "Could not create proposal";
  }

  revalidatePath("/proposals");
}

export async function castVoteAction(proposalId: string, choice: "YES" | "NO") {
  const user = await requireUser();
  const parsed = voteSchema.safeParse({ proposalId, choice });
  if (!parsed.success) throw new Error("Invalid vote");

  await castVote(parsed.data.proposalId, user.id, parsed.data.choice);
  revalidatePath("/proposals");
  revalidatePath(`/proposals/${proposalId}`);
}

/**
 * Manual safety net for the "resolve proposals whose deadline has passed"
 * step normally done by the scheduled job — same rule enforced here (only
 * once the deadline has actually passed) so this can't be used to cut
 * voting short.
 */
export async function resolveProposalNowAction(proposalId: string) {
  const admin = await requireAdmin();
  const proposal = await prisma.proposal.findUniqueOrThrow({ where: { id: proposalId } });
  if (proposal.votingDeadline > new Date()) {
    throw new Error("Voting is still open — the deadline hasn't passed yet");
  }
  await resolveProposal(proposalId, { userId: admin.id });
  revalidatePath("/proposals");
  revalidatePath(`/proposals/${proposalId}`);
}

export async function markImplementedAction(proposalId: string) {
  const admin = await requireAdmin();
  await markProposalImplemented(proposalId, { userId: admin.id });
  revalidatePath("/proposals");
  revalidatePath(`/proposals/${proposalId}`);
}
