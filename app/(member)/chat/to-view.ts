import { getSignedProofUrl, STORAGE_BUCKETS } from "@/lib/storage";
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

/** Maps a stored message to what the client sees, minting a signed URL for any attachment. */
export async function toChatMessageView(message: MessageRecord): Promise<ChatMessageView> {
  return {
    id: message.id,
    content: message.deletedAt ? "" : message.content,
    type: message.type as ChatMessageView["type"],
    attachmentUrl:
      message.attachmentPath && !message.deletedAt
        ? await getSignedProofUrl(STORAGE_BUCKETS.chatAttachments, message.attachmentPath, 3600).catch(() => null)
        : null,
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
