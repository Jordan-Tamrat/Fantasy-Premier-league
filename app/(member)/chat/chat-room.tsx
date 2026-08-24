"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, Send, Pin, Trash2, CornerUpLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sendMessageAction, deleteMessageAction, togglePinAction, fetchNewMessagesAction } from "./actions";
import type { ChatMessageView } from "./message-view";

// Live updates by polling rather than websockets: for a private league of ~20
// this is entirely adequate and avoids bridging NextAuth sessions into
// Supabase Realtime's RLS model.
const POLL_INTERVAL_MS = 4000;

export function ChatRoom({
  initialMessages,
  currentUserId,
  isAdmin,
}: {
  initialMessages: ChatMessageView[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [replyTo, setReplyTo] = useState<ChatMessageView | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [error, formAction, isPending] = useActionState(sendMessageAction, undefined);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  // Mirrored into a ref so the polling interval can read the newest message
  // without being torn down and recreated on every render.
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Poll for anything sent by other members since the newest message we hold.
  useEffect(() => {
    const interval = setInterval(async () => {
      if (document.hidden) return;
      const latest = messagesRef.current[messagesRef.current.length - 1];
      const since = latest?.createdAt ?? new Date(0).toISOString();
      try {
        const incoming = await fetchNewMessagesAction(since);
        if (incoming.length > 0) {
          setMessages((prev) => {
            const known = new Set(prev.map((m) => m.id));
            return [...prev, ...incoming.filter((m) => !known.has(m.id))];
          });
        }
      } catch {
        // A failed poll is not worth surfacing — the next tick retries.
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Clear the composer as soon as the message is handed off, rather than
  // reacting to isPending in an effect (which causes cascading renders).
  const handleSubmit = (formData: FormData) => {
    formAction(formData);
    formRef.current?.reset();
    setAttachmentName(null);
    setReplyTo(null);
  };

  const pinned = messages.filter((m) => m.isPinned && !m.isDeleted);

  return (
    // Mobile height subtracts the app header (3.5rem) and the space the shell
    // reserves for the floating bottom nav (pb-24 = 6rem); dvh so mobile
    // browser chrome doesn't clip the composer.
    <div className="flex h-[calc(100dvh-3.5rem-6rem)] flex-col md:h-screen">
      {pinned.length > 0 && (
        <div className="shrink-0 border-b bg-[var(--fpl-cyan)]/8 px-4 py-2">
          {pinned.map((m) => (
            <p key={m.id} className="flex items-center gap-2 truncate text-xs">
              <Pin className="size-3 shrink-0" />
              <span className="font-semibold">{m.senderName}:</span> {m.content}
            </p>
          ))}
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">No messages yet. Say hello 👋</p>
        )}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.senderId === currentUserId}
            isAdmin={isAdmin}
            onReply={() => setReplyTo(message)}
            onDelete={() => startTransition(() => void deleteMessageAction(message.id))}
            onTogglePin={() => startTransition(() => void togglePinAction(message.id, !message.isPinned))}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <form ref={formRef} action={handleSubmit} className="shrink-0 border-t bg-card p-3">
        {replyTo && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs">
            <CornerUpLeft className="size-3 shrink-0" />
            <span className="flex-1 truncate">
              Replying to <span className="font-semibold">{replyTo.senderName}</span>: {replyTo.content}
            </span>
            <button type="button" onClick={() => setReplyTo(null)} aria-label="Cancel reply">
              <X className="size-3.5" />
            </button>
          </div>
        )}
        <input type="hidden" name="replyToId" value={replyTo?.id ?? ""} />
        {attachmentName && (
          <p className="mb-2 truncate rounded-lg bg-muted px-3 py-1.5 text-xs">📎 {attachmentName}</p>
        )}
        <div className="flex items-end gap-2">
          <label
            htmlFor="attachment"
            className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-accent"
            aria-label="Attach image"
          >
            <ImagePlus className="size-4.5" />
          </label>
          <input
            id="attachment"
            name="attachment"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => setAttachmentName(e.target.files?.[0]?.name ?? null)}
          />
          <textarea
            name="content"
            rows={1}
            placeholder="Message the league…"
            className="max-h-32 min-h-10 flex-1 resize-none rounded-2xl border bg-background px-4 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
          />
          <Button type="submit" size="icon-lg" className="shrink-0 rounded-full" disabled={isPending} aria-label="Send">
            <Send className="size-4" />
          </Button>
        </div>
        {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
      </form>
    </div>
  );
}

function MessageBubble({
  message,
  isOwn,
  isAdmin,
  onReply,
  onDelete,
  onTogglePin,
}: {
  message: ChatMessageView;
  isOwn: boolean;
  isAdmin: boolean;
  onReply: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}) {
  if (message.type === "SYSTEM") {
    return (
      <p className="mx-auto max-w-md whitespace-pre-line rounded-full bg-secondary px-4 py-1.5 text-center text-xs font-medium text-secondary-foreground">
        {message.content}
      </p>
    );
  }

  if (message.isDeleted) {
    return (
      <p className={cn("text-xs italic text-muted-foreground", isOwn && "text-right")}>Message deleted</p>
    );
  }

  return (
    <div className={cn("group flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
      {!isOwn && <p className="px-1 text-xs font-semibold text-muted-foreground">{message.senderName}</p>}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
          isOwn ? "bg-primary text-primary-foreground" : "bg-card border",
        )}
      >
        {message.replyToContent && (
          <p
            className={cn(
              "mb-1.5 border-l-2 pl-2 text-xs opacity-70",
              isOwn ? "border-primary-foreground/40" : "border-border",
            )}
          >
            <span className="font-semibold">{message.replyToName}</span>: {message.replyToContent}
          </p>
        )}
        {message.attachmentUrl && (
          <a href={message.attachmentUrl} target="_blank" rel="noreferrer" className="mb-1.5 block">
            <Image
              src={message.attachmentUrl}
              alt="Attachment"
              width={320}
              height={240}
              unoptimized
              className="max-h-64 w-auto rounded-lg object-contain"
            />
          </a>
        )}
        {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
        <p className={cn("mt-0.5 text-[10px]", isOwn ? "text-primary-foreground/60" : "text-muted-foreground")}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          {message.isEdited && " · edited"}
        </p>
      </div>
      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <IconAction onClick={onReply} label="Reply">
          <CornerUpLeft className="size-3" />
        </IconAction>
        {isAdmin && (
          <IconAction onClick={onTogglePin} label={message.isPinned ? "Unpin" : "Pin"}>
            <Pin className="size-3" />
          </IconAction>
        )}
        {(isOwn || isAdmin) && (
          <IconAction onClick={onDelete} label="Delete">
            <Trash2 className="size-3" />
          </IconAction>
        )}
      </div>
    </div>
  );
}

function IconAction({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}
