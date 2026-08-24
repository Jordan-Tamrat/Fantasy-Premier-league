"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { sendMessageSchema } from "@/lib/validations/phase2.schema";
import { sendMessage, deleteMessage, setMessagePinned, listMessagesSince, listMessages } from "@/services/chatService";
import { toChatMessageView } from "./to-view";
import type { ChatMessageView } from "./message-view";

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

/** Polled by the chat client to pick up messages sent by other members. */
export async function fetchNewMessagesAction(sinceIso: string): Promise<ChatMessageView[]> {
  await requireUser();
  const since = new Date(sinceIso);
  if (Number.isNaN(since.getTime())) return [];
  const messages = await listMessagesSince(since);
  return messages.map(toChatMessageView);
}

/** Walks backwards through history for the "Load older messages" button. */
export async function fetchOlderMessagesAction(
  beforeIso: string,
): Promise<{ messages: ChatMessageView[]; hasMore: boolean }> {
  await requireUser();
  const before = new Date(beforeIso);
  if (Number.isNaN(before.getTime())) return { messages: [], hasMore: false };
  const { messages, hasMore } = await listMessages({ before });
  return { messages: messages.map(toChatMessageView), hasMore };
}
