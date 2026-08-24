import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/services/auditService";

export async function listRuleSections() {
  return prisma.ruleSection.findMany({ orderBy: { order: "asc" } });
}

export async function createRuleSection(input: { title: string; body: string }, actor: { userId: string }) {
  const last = await prisma.ruleSection.findFirst({ orderBy: { order: "desc" } });
  const section = await prisma.ruleSection.create({
    data: { title: input.title, body: input.body, order: (last?.order ?? 0) + 1 },
  });
  await writeAuditLog(prisma, {
    actorUserId: actor.userId,
    action: "RULE_SECTION_CREATED",
    entityType: "RuleSection",
    entityId: section.id,
    newValue: { title: input.title, body: input.body },
  });
  return section;
}

/**
 * Edits record the previous text in the audit log, so an old rule is never
 * silently overwritten — that's the history guarantee, without a separate
 * versioning subsystem.
 */
export async function updateRuleSection(
  sectionId: string,
  input: { title: string; body: string },
  actor: { userId: string },
) {
  const existing = await prisma.ruleSection.findUnique({ where: { id: sectionId } });
  if (!existing) throw new Error("Rule section not found");

  const updated = await prisma.ruleSection.update({
    where: { id: sectionId },
    data: { title: input.title, body: input.body },
  });
  await writeAuditLog(prisma, {
    actorUserId: actor.userId,
    action: "RULE_SECTION_UPDATED",
    entityType: "RuleSection",
    entityId: sectionId,
    oldValue: { title: existing.title, body: existing.body },
    newValue: { title: input.title, body: input.body },
  });
  return updated;
}

export async function deleteRuleSection(sectionId: string, actor: { userId: string }) {
  const existing = await prisma.ruleSection.findUnique({ where: { id: sectionId } });
  if (!existing) throw new Error("Rule section not found");

  await prisma.ruleSection.delete({ where: { id: sectionId } });
  await writeAuditLog(prisma, {
    actorUserId: actor.userId,
    action: "RULE_SECTION_DELETED",
    entityType: "RuleSection",
    entityId: sectionId,
    oldValue: { title: existing.title, body: existing.body },
  });
}
