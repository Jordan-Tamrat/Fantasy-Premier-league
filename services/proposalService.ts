import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/services/auditService";
import { notifyEveryone } from "@/services/notificationService";
import { postSystemMessage } from "@/services/chatService";
import type { VoteChoice } from "@/lib/generated/prisma/client";

export async function listProposals() {
  return prisma.proposal.findMany({
    include: {
      author: { select: { name: true } },
      votes: { select: { choice: true, userId: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function getProposal(proposalId: string) {
  return prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      author: { select: { name: true } },
      votes: { include: { user: { select: { id: true, name: true } } } },
    },
  });
}

export function tallyVotes(votes: { choice: VoteChoice }[]) {
  const yes = votes.filter((v) => v.choice === "YES").length;
  const no = votes.filter((v) => v.choice === "NO").length;
  const total = yes + no;
  return { yes, no, total, yesPercent: total === 0 ? 0 : Math.round((yes / total) * 100) };
}

export async function createProposal(
  input: { title: string; description: string; votingDeadline: Date },
  actor: { userId: string },
) {
  return prisma.$transaction(async (tx) => {
    const proposal = await tx.proposal.create({
      data: {
        title: input.title,
        description: input.description,
        votingDeadline: input.votingDeadline,
        authorId: actor.userId,
      },
    });

    await postSystemMessage(tx, `🗳️ New rule proposal: "${input.title}" — voting is open.`);
    await notifyEveryone(
      tx,
      {
        type: "PROPOSAL_OPENED",
        title: "New rule proposal",
        body: input.title,
        href: `/proposals/${proposal.id}`,
      },
      { exceptUserId: actor.userId },
    );

    return proposal;
  });
}

export async function castVote(proposalId: string, userId: string, choice: VoteChoice) {
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
  if (!proposal) throw new Error("Proposal not found");
  if (proposal.status !== "OPEN") throw new Error("Voting on this proposal has closed");
  if (proposal.votingDeadline < new Date()) throw new Error("The voting deadline has passed");

  // Upsert so a member can change their mind while voting is open, without
  // ever creating a second vote (the unique constraint backs this up).
  return prisma.vote.upsert({
    where: { proposalId_userId: { proposalId, userId } },
    create: { proposalId, userId, choice },
    update: { choice },
  });
}

/** Simple majority: YES > NO passes. Called by cron once the deadline passes. */
export async function resolveProposal(proposalId: string, actor?: { userId?: string; label?: string }) {
  return prisma.$transaction(async (tx) => {
    const proposal = await tx.proposal.findUnique({
      where: { id: proposalId },
      include: { votes: { select: { choice: true } } },
    });
    if (!proposal || proposal.status !== "OPEN") return null;

    const { yes, no } = tallyVotes(proposal.votes);
    const passed = yes > no;
    const status = passed ? "PASSED" : "REJECTED";

    const updated = await tx.proposal.update({
      where: { id: proposalId },
      data: { status, resolvedAt: new Date() },
    });

    await writeAuditLog(tx, {
      actorUserId: actor?.userId,
      actorLabel: actor?.label ?? "SYSTEM_CRON",
      action: "PROPOSAL_RESOLVED",
      entityType: "Proposal",
      entityId: proposalId,
      newValue: { status, yes, no },
    });
    await postSystemMessage(
      tx,
      `🗳️ Proposal "${proposal.title}" ${passed ? "PASSED" : "was REJECTED"} — ${yes} yes / ${no} no.`,
    );
    await notifyEveryone(tx, {
      type: "PROPOSAL_RESOLVED",
      title: `Proposal ${passed ? "passed" : "rejected"}`,
      body: `${proposal.title} — ${yes} yes / ${no} no`,
      href: `/proposals/${proposalId}`,
    });

    return updated;
  });
}

/** Cron entry point: close out every proposal whose deadline has passed. */
export async function resolveDueProposals() {
  const due = await prisma.proposal.findMany({
    where: { status: "OPEN", votingDeadline: { lte: new Date() } },
    select: { id: true },
  });
  for (const proposal of due) {
    await resolveProposal(proposal.id);
  }
  return due.length;
}

/** Admin marks a passed proposal as actually applied to the rules. */
export async function markProposalImplemented(proposalId: string, actor: { userId: string }) {
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
  if (!proposal) throw new Error("Proposal not found");
  if (proposal.status !== "PASSED") throw new Error("Only a passed proposal can be marked implemented");

  const updated = await prisma.proposal.update({
    where: { id: proposalId },
    data: { status: "IMPLEMENTED" },
  });
  await writeAuditLog(prisma, {
    actorUserId: actor.userId,
    action: "PROPOSAL_IMPLEMENTED",
    entityType: "Proposal",
    entityId: proposalId,
  });
  return updated;
}
