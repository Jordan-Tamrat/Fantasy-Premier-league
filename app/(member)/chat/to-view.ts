import { avatarUrl } from "@/components/rank-badge";
import type { ChatMessageView, ChatMessageUpdate, ReactionView } from "./message-view";

interface ReactionRecord {
  emoji: string;
  userId: string;
}

interface MessageRecord {
  id: string;
  content: string;
  type: string;
  attachmentPath: string | null;
  pinnedAt: Date | null;
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  sender: { id: string; name: string; role: string; profileImagePath: string | null } | null;
  replyTo?: { id: string; content: string; sender: { name: string } | null } | null;
  reactions?: ReactionRecord[];
}

interface MessageUpdateRecord {
  id: string;
  content: string;
  attachmentPath: string | null;
  pinnedAt: Date | null;
  editedAt: Date | null;
  deletedAt: Date | null;
  reactions?: ReactionRecord[];
}

/** Collapses raw reaction rows into per-emoji counts, flagging the viewer's own. */
function aggregateReactions(reactions: ReactionRecord[] | undefined, currentUserId: string | null): ReactionView[] {
  if (!reactions || reactions.length === 0) return [];
  const byEmoji = new Map<string, ReactionView>();
  for (const r of reactions) {
    const entry = byEmoji.get(r.emoji) ?? { emoji: r.emoji, count: 0, mine: false };
    entry.count += 1;
    if (currentUserId && r.userId === currentUserId) entry.mine = true;
    byEmoji.set(r.emoji, entry);
  }
  return [...byEmoji.values()];
}

/**
 * Maps a stored message to what the client sees. Attachments are referenced by
 * a stable app URL rather than a signed Supabase URL, so rendering a page of
 * messages costs no Storage API calls — the URL is minted on demand by
 * app/api/attachments/[kind]/[id] when a browser actually loads the image.
 */
export function toChatMessageView(message: MessageRecord, currentUserId: string | null): ChatMessageView {
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
    senderAvatarUrl: message.sender ? avatarUrl(message.sender) : null,
    replyToName: message.replyTo?.sender?.name ?? null,
    replyToContent: message.replyTo?.content ?? null,
    reactions: message.deletedAt ? [] : aggregateReactions(message.reactions, currentUserId),
  };
}

/** The subset of fields the update poll refreshes on messages already on screen. */
export function toChatMessageUpdate(message: MessageUpdateRecord, currentUserId: string | null): ChatMessageUpdate {
  return {
    id: message.id,
    content: message.deletedAt ? "" : message.content,
    isPinned: !!message.pinnedAt,
    isEdited: !!message.editedAt,
    isDeleted: !!message.deletedAt,
    attachmentUrl:
      message.attachmentPath && !message.deletedAt ? `/api/attachments/chat/${message.id}` : null,
    reactions: message.deletedAt ? [] : aggregateReactions(message.reactions, currentUserId),
  };
}
