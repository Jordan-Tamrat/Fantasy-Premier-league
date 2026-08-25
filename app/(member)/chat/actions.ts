"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { sendMessageSchema } from "@/lib/validations/phase2.schema";
import {
  sendMessage,
  deleteMessage,
  setMessagePinned,
  listMessagesSince,
  listMessages,
  getMessageUpdates,
  toggleReaction,
} from "@/services/chatService";
import { toChatMessageView, toChatMessageUpdate } from "./to-view";
import type { ChatMessageView, ChatMessageUpdate } from "./message-view";

export async function sendMessageAction(_prevState: string | undefined, formData: FormData) {
  const user = await requireUser();
  const parsed = sendMessageSchema.safeParse({
    content: formData.get("content"),
    replyToId: formData.get("replyToId"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid message";

  const attachment = formData.get("attachment");
  const hasAttachment = attachment instanceof File && attachment.size > 0;
  if (!parsed.data.content && !hasAttachment) return "Type a message or attach an image";

  try {
    await sendMessage({
      senderId: user.id,
      content: parsed.data.content,
      replyToId: parsed.data.replyToId || undefined,
      attachment: hasAttachment ? attachment : undefined,
    });
  } catch (error) {
    return error instanceof Error ? error.message : "Could not send message";
  }

  revalidatePath("/chat");
}

export async function deleteMessageAction(messageId: string) {
  const user = await requireUser();
  await deleteMessage(messageId, { userId: user.id, isAdmin: user.role === "ADMIN" });
  revalidatePath("/chat");
}

export async function togglePinAction(messageId: string, pinned: boolean) {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Admin access required");
  await setMessagePinned(messageId, pinned, user.id);
  revalidatePath("/chat");
}

/**
 * One poll = one request: fetches messages newer than `sinceIso` AND refreshed
 * state (reactions/pins/edits/deletes) for the messages already on screen, in a
 * single round trip with the two DB queries run in parallel. Merging these
 * halves the serverless invocations and DB round-trips the chat makes per tick,
 * which keeps the 4-second polling comfortably within Vercel/Supabase free
 * tiers for a small league.
 */
export async function fetchChatSyncAction(
  sinceIso: string,
  ids: string[],
): Promise<{ newMessages: ChatMessageView[]; updates: ChatMessageUpdate[] }> {
  const user = await requireUser();
  const since = new Date(sinceIso);
  const [newRows, updateRows] = await Promise.all([
    Number.isNaN(since.getTime()) ? Promise.resolve([]) : listMessagesSince(since),
    ids.length > 0 ? getMessageUpdates(ids) : Promise.resolve([]),
  ]);
  return {
    newMessages: newRows.map((m) => toChatMessageView(m, user.id)),
    updates: updateRows.map((r) => toChatMessageUpdate(r, user.id)),
  };
}

/** Walks backwards through history for the "Load older messages" button. */
export async function fetchOlderMessagesAction(
  beforeIso: string,
): Promise<{ messages: ChatMessageView[]; hasMore: boolean }> {
  const user = await requireUser();
  const before = new Date(beforeIso);
  if (Number.isNaN(before.getTime())) return { messages: [], hasMore: false };
  const { messages, hasMore } = await listMessages({ before });
  return { messages: messages.map((m) => toChatMessageView(m, user.id)), hasMore };
}

/** Toggles the current user's emoji reaction on a message. */
export async function toggleReactionAction(messageId: string, emoji: string): Promise<void> {
  const user = await requireUser();
  await toggleReaction(messageId, user.id, emoji);
}
