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
  replyToName: string | null;
  replyToContent: string | null;
}
