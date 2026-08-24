import { requireUser } from "@/lib/auth";
import { listMessages } from "@/services/chatService";
import { toChatMessageView } from "./to-view";
import { ChatRoom } from "./chat-room";

export default async function ChatPage() {
  const user = await requireUser();
  const messages = await listMessages();
  const views = messages.map(toChatMessageView);

  return <ChatRoom initialMessages={views} currentUserId={user.id} isAdmin={user.role === "ADMIN"} />;
}
