/** One emoji's tally on a message. `mine` = the current viewer reacted with it. */
export interface ReactionView {
  emoji: string;
  count: number;
  mine: boolean;
}

/** Shape the chat client renders — plain data, safe across the RSC boundary. */
export interface ChatMessageView {
  id: string;
  content: string;
  type: "TEXT" | "IMAGE" | "SYSTEM";
  attachmentUrl: string | null;
  isPinned: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  senderId: string | null;
  senderName: string | null;
  senderAvatarUrl: string | null;
  replyToName: string | null;
  replyToContent: string | null;
  reactions: ReactionView[];
}

/** Live-updatable fields of an existing message, returned by the update poll. */
export interface ChatMessageUpdate {
  id: string;
  content: string;
  isPinned: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  attachmentUrl: string | null;
  reactions: ReactionView[];
}
