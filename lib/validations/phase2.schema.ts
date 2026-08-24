import { z } from "zod";

export const sendMessageSchema = z.object({
  content: z.string().trim().max(2000),
  replyToId: z.string().optional().or(z.literal("")),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(2000),
});

export const ruleSectionSchema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(4000),
});

export const proposalSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2000),
  votingDeadline: z.coerce.date(),
});

export const voteSchema = z.object({
  proposalId: z.string().min(1),
  choice: z.enum(["YES", "NO"]),
});

export const disputeSchema = z.object({
  category: z.enum(["PAYMENT", "FPL_SCORE", "ELIGIBILITY", "PRIZE", "RULE", "TECHNICAL", "OTHER"]),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2000),
});

export const disputeResponseSchema = z.object({
  disputeId: z.string().min(1),
  status: z.enum(["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"]),
  adminResponse: z.string().trim().min(1).max(2000),
});
