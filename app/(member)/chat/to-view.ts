import type { ChatMessageView } from "./message-view";

interface MessageRecord {
  id: string;
  content: string;
  type: string;
  attachmentPath: string | null;
  pinnedAt: Date | null;
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  sender: { id: string; name: string; role: string } | null;
  replyTo?: { id: string; content: string; sender: { name: string } | null } | null;
}

/**
 * Maps a stored message to what the client sees. Attachments are referenced by
 * a stable app URL rather than a signed Supabase URL, so rendering a page of
 * messages costs no Storage API calls — the URL is minted on demand by
 * app/api/attachments/[kind]/[id] when a browser actually loads the image.
 */
export function toChatMessageView(message: MessageRecord): ChatMessageView {
  return {
    id: message.id,
    content: message.deletedAt ? "" : message.content,
    type: message.type as ChatMessageView["type"],
    attachmentUrl:
      message.attachmentPath && !message.deletedAt ? `/api/attachments/chat/${message.id}` : null,
    isPinned: !!message.pinnedAt,
    isEdited: !!message.editedAt,
    isDeleted: !!message.deletedAt,
    createdAt: message.createdAt.toISOString(),
    senderId: message.sender?.id ?? null,
    senderName: message.sender?.name ?? null,
    replyToName: message.replyTo?.sender?.name ?? null,
    replyToContent: message.replyTo?.content ?? null,
  };
}
