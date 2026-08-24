"use server";

import { revalidatePath } from "next/cache";
import { requireUser, requireAdmin } from "@/lib/auth";
import { proposalSchema, voteSchema } from "@/lib/validations/phase2.schema";
import { createProposal, castVote, markProposalImplemented } from "@/services/proposalService";

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

export async function markImplementedAction(proposalId: string) {
  const admin = await requireAdmin();
  await markProposalImplemented(proposalId, { userId: admin.id });
  revalidatePath("/proposals");
  revalidatePath(`/proposals/${proposalId}`);
}
