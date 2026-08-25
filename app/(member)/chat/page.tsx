import { requireUser } from "@/lib/auth";
import { listMessages } from "@/services/chatService";
import { toChatMessageView } from "./to-view";
import { ChatRoom } from "./chat-room";

export default async function ChatPage() {
  const user = await requireUser();
  const { messages, hasMore } = await listMessages();

  return (
    <ChatRoom
      initialMessages={messages.map((m) => toChatMessageView(m, user.id))}
      initialHasMore={hasMore}
      currentUserId={user.id}
      isAdmin={user.role === "ADMIN"}
    />
  );
}
