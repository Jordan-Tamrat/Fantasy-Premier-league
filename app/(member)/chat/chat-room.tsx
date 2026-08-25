"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, Send, Pin, Trash2, CornerUpLeft, X, SmilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/rank-badge";
import { cn } from "@/lib/utils";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from "@/lib/uploadLimits";
import { compressImage } from "@/lib/image-compress";
import { formatTime, leagueDayKey, formatDaySeparator } from "@/lib/datetime";
import {
  sendMessageAction,
  deleteMessageAction,
  togglePinAction,
  fetchChatSyncAction,
  fetchOlderMessagesAction,
  toggleReactionAction,
} from "./actions";
import type { ChatMessageView, ReactionView } from "./message-view";

// The quick-reaction palette shown when you tap the react button.
const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "🎉", "😮"];

// Live updates by polling rather than websockets: for a private league of ~20
// this is entirely adequate and avoids bridging NextAuth sessions into
// Supabase Realtime's RLS model.
//
// The interval adapts so an idle tab isn't burning a request every 4s all day:
// fast while the conversation is moving, slow once it's been quiet for a
// while. Any new message (received or sent) counts as activity.
const POLL_ACTIVE_MS = 4000;
const POLL_IDLE_MS = 20000;
const ACTIVITY_WINDOW_MS = 2 * 60 * 1000;

export function ChatRoom({
  initialMessages,
  initialHasMore,
  currentUserId,
  isAdmin,
}: {
  initialMessages: ChatMessageView[];
  initialHasMore: boolean;
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessageView | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isCompressingAttachment, setIsCompressingAttachment] = useState(false);
  // The chat image currently shown full-screen in the lightbox, or null.
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [error, formAction, isPending] = useActionState(sendMessageAction, undefined);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Mirrored into a ref so the polling interval can read the newest message
  // without being torn down and recreated on every render.
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Seeded in the effect below, not here — Date.now() during render is impure.
  const lastActivityRef = useRef(0);

  // Poll for anything sent by other members since the newest message we hold.
  // Self-scheduling timeout rather than setInterval so the delay can change
  // between ticks.
  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    lastActivityRef.current = Date.now();

    const tick = async () => {
      // A hidden tab skips the request but keeps a cheap timer running, so
      // coming back to it picks up within one active interval.
      if (!document.hidden) {
        const latest = messagesRef.current[messagesRef.current.length - 1];
        const since = latest?.createdAt ?? new Date(0).toISOString();
        const ids = messagesRef.current.map((m) => m.id);
        try {
          // One request pulls both new messages and refreshed state (reactions,
          // pins, edits, deletions) for messages already on screen.
          const { newMessages, updates } = await fetchChatSyncAction(since, ids);
          if (newMessages.length > 0 && !cancelled) {
            lastActivityRef.current = Date.now();
            setMessages((prev) => {
              const known = new Set(prev.map((m) => m.id));
              return [...prev, ...newMessages.filter((m) => !known.has(m.id))];
            });
          }
          if (updates.length > 0 && !cancelled) {
            const byId = new Map(updates.map((u) => [u.id, u]));
            setMessages((prev) => prev.map((m) => (byId.has(m.id) ? { ...m, ...byId.get(m.id)! } : m)));
          }
        } catch {
          // A failed poll is not worth surfacing — the next tick retries.
        }
      }
      if (cancelled) return;
      const isQuiet = !document.hidden && Date.now() - lastActivityRef.current > ACTIVITY_WINDOW_MS;
      timeoutId = setTimeout(tick, isQuiet ? POLL_IDLE_MS : POLL_ACTIVE_MS);
    };

    timeoutId = setTimeout(tick, POLL_ACTIVE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  // Close the image lightbox on Escape, like any modal.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  // Keyed on the *last* message rather than message count, so prepending older
  // history doesn't yank the view down to the bottom. First run jumps instantly
  // (landing at the latest message); later ones animate.
  const lastMessageId = messages[messages.length - 1]?.id;
  const hasAutoScrolledRef = useRef(false);
  useEffect(() => {
    if (!lastMessageId) return;
    bottomRef.current?.scrollIntoView({ behavior: hasAutoScrolledRef.current ? "smooth" : "auto" });
    hasAutoScrolledRef.current = true;
  }, [lastMessageId]);

  const loadOlder = async () => {
    const container = scrollRef.current;
    const oldest = messages[0];
    if (!oldest || isLoadingOlder) return;

    setIsLoadingOlder(true);
    const heightBefore = container?.scrollHeight ?? 0;
    try {
      const older = await fetchOlderMessagesAction(oldest.createdAt);
      setMessages((prev) => {
        const known = new Set(prev.map((m) => m.id));
        return [...older.messages.filter((m) => !known.has(m.id)), ...prev];
      });
      setHasMore(older.hasMore);
      // Prepending grows the scroll area upwards, which would otherwise shift
      // whatever the reader was looking at. Nudge scrollTop by exactly the
      // height that was added so the view appears to stay put.
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop += el.scrollHeight - heightBefore;
      });
    } catch {
      // Leave the button in place so it can simply be tried again.
    } finally {
      setIsLoadingOlder(false);
    }
  };

  // Clear the composer as soon as the message is handed off, rather than
  // reacting to isPending in an effect (which causes cascading renders).
  const handleSubmit = (formData: FormData) => {
    formAction(formData);
    // Sending counts as activity, so the poll stays on the fast interval
    // while a conversation is actually happening.
    lastActivityRef.current = Date.now();
    formRef.current?.reset();
    setAttachmentName(null);
    setAttachmentError(null);
    setReplyTo(null);
  };

  const handleAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) {
      setAttachmentName(null);
      setAttachmentError(null);
      return;
    }
    setAttachmentError(null);

    // Chat photos still need to read as a real image (unlike an avatar), so
    // this uses a milder resize than the profile picture — big enough to
    // keep text/detail legible, small enough that a full-res camera shot
    // doesn't blow past the upload limit.
    setIsCompressingAttachment(true);
    const optimized = await compressImage(file, { maxDimension: 1600, quality: 0.85 });
    setIsCompressingAttachment(false);

    if (optimized.size > MAX_UPLOAD_BYTES) {
      setAttachmentError(`Image is too large (max ${MAX_UPLOAD_MB}MB).`);
      setAttachmentName(null);
      input.value = "";
      return;
    }

    // Swap the input's FileList so the form submits the optimized file
    // instead of the original the user picked.
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(optimized);
    input.files = dataTransfer.files;
    setAttachmentName(optimized.name);
  };

  // Toggle a reaction optimistically (instant feedback), then persist. The
  // poll reconciles with everyone else's reactions on the next tick.
  const handleToggleReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const existing = m.reactions.find((r) => r.emoji === emoji);
        let reactions: ReactionView[];
        if (!existing) {
          reactions = [...m.reactions, { emoji, count: 1, mine: true }];
        } else if (existing.mine) {
          reactions =
            existing.count <= 1
              ? m.reactions.filter((r) => r.emoji !== emoji)
              : m.reactions.map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1, mine: false } : r));
        } else {
          reactions = m.reactions.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1, mine: true } : r));
        }
        return { ...m, reactions };
      }),
    );
    startTransition(() => void toggleReactionAction(messageId, emoji));
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
              <Pin className="size-3 shrink-0 fill-current text-[var(--fpl-cyan)]" />
              <span className="font-semibold">{m.senderName}:</span> {m.content}
            </p>
          ))}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {hasMore && (
          <div className="flex justify-center pb-1">
            <Button variant="outline" size="sm" onClick={loadOlder} disabled={isLoadingOlder}>
              {isLoadingOlder ? "Loading…" : "Load older messages"}
            </Button>
          </div>
        )}
        {!hasMore && messages.length > 0 && (
          <p className="pb-1 text-center text-xs text-muted-foreground">Start of the conversation</p>
        )}
        {messages.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">No messages yet. Say hello 👋</p>
        )}
        {messages.map((message, index) => {
          const prev = messages[index - 1];
          // A separator whenever the calendar day (in league time) changes,
          // Telegram-style — and always before the very first message.
          const showDaySeparator =
            !prev || leagueDayKey(prev.createdAt) !== leagueDayKey(message.createdAt);
          return (
            <div key={message.id} className="space-y-3">
              {showDaySeparator && (
                <div className="flex justify-center py-1">
                  <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-secondary-foreground">
                    {formatDaySeparator(message.createdAt)}
                  </span>
                </div>
              )}
              <MessageBubble
                message={message}
                isOwn={message.senderId === currentUserId}
                isAdmin={isAdmin}
                onReply={() => setReplyTo(message)}
                onDelete={() => startTransition(() => void deleteMessageAction(message.id))}
                onTogglePin={() => startTransition(() => void togglePinAction(message.id, !message.isPinned))}
                onToggleReaction={(emoji) => handleToggleReaction(message.id, emoji)}
                onOpenImage={setLightbox}
              />
            </div>
          );
        })}
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
        {isCompressingAttachment && (
          <p className="mb-2 rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground">Optimizing image…</p>
        )}
        {attachmentName && !isCompressingAttachment && (
          <p className="mb-2 truncate rounded-lg bg-muted px-3 py-1.5 text-xs">📎 {attachmentName}</p>
        )}
        {attachmentError && <p className="mb-2 text-xs text-destructive">{attachmentError}</p>}
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
            onChange={handleAttachmentChange}
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
          <Button
            type="submit"
            size="icon-lg"
            className="shrink-0 rounded-full"
            disabled={isPending || isCompressingAttachment}
            aria-label="Send"
          >
            <Send className="size-4" />
          </Button>
        </div>
        {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
      </form>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Close"
            className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="size-5" />
          </button>
          {/* Stop the backdrop's close handler firing when the image itself is
              tapped, so panning/zooming a photo doesn't dismiss it. */}
          <Image
            src={lightbox}
            alt="Attachment"
            width={1600}
            height={1600}
            unoptimized
            onClick={(e) => e.stopPropagation()}
            className="max-h-full w-auto max-w-full rounded-lg object-contain"
          />
        </div>
      )}
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
  onToggleReaction,
  onOpenImage,
}: {
  message: ChatMessageView;
  isOwn: boolean;
  isAdmin: boolean;
  onReply: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onToggleReaction: (emoji: string) => void;
  onOpenImage: (url: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

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

  const pickReaction = (emoji: string) => {
    onToggleReaction(emoji);
    setShowPicker(false);
  };

  return (
    <div className={cn("group flex items-end gap-2", isOwn ? "flex-row-reverse" : "flex-row")}>
      {!isOwn && <Avatar name={message.senderName ?? "?"} imageUrl={message.senderAvatarUrl} size="sm" />}
      <div className={cn("flex max-w-[80%] flex-col gap-1", isOwn ? "items-end" : "items-start")}>
        {!isOwn && <p className="px-1 text-xs font-semibold text-muted-foreground">{message.senderName}</p>}
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm",
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
            <button
              type="button"
              onClick={() => onOpenImage(message.attachmentUrl!)}
              className="mb-1.5 block cursor-zoom-in"
              aria-label="Open image"
            >
              <Image
                src={message.attachmentUrl}
                alt="Attachment"
                width={320}
                height={240}
                unoptimized
                className="max-h-64 w-auto rounded-lg object-contain"
              />
            </button>
          )}
          {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
          <p className={cn("mt-0.5 flex items-center gap-1 text-[10px]", isOwn ? "text-primary-foreground/60" : "text-muted-foreground")}>
            {message.isPinned && <Pin className="size-2.5 fill-current text-[var(--fpl-cyan)]" />}
            {formatTime(message.createdAt)}
            {message.isEdited && " · edited"}
          </p>
        </div>

        {message.reactions.length > 0 && (
          <div className={cn("flex flex-wrap gap-1", isOwn ? "justify-end" : "justify-start")}>
            {message.reactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                onClick={() => onToggleReaction(r.emoji)}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
                  r.mine
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted",
                )}
                aria-label={`${r.emoji} ${r.count}${r.mine ? " (you reacted)" : ""}`}
              >
                <span>{r.emoji}</span>
                <span className="font-semibold tabular-nums">{r.count}</span>
              </button>
            ))}
          </div>
        )}

        {showPicker && (
          <div className="flex gap-1 rounded-full border bg-card px-2 py-1 shadow-sm">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => pickReaction(emoji)}
                className="rounded-full px-1 text-lg transition-transform hover:scale-125"
                aria-label={`React ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Actions stay visible on touch (no hover on mobile) and reveal on
            hover on desktop. */}
        <div className="flex gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
          <IconAction onClick={() => setShowPicker((v) => !v)} label="React">
            <SmilePlus className="size-3" />
          </IconAction>
          <IconAction onClick={onReply} label="Reply">
            <CornerUpLeft className="size-3" />
          </IconAction>
          {isAdmin && (
            <IconAction onClick={onTogglePin} label={message.isPinned ? "Unpin" : "Pin"}>
              <Pin className={cn("size-3", message.isPinned && "fill-current text-[var(--fpl-cyan)]")} />
            </IconAction>
          )}
          {(isOwn || isAdmin) && (
            <IconAction onClick={onDelete} label="Delete">
              <Trash2 className="size-3" />
            </IconAction>
          )}
        </div>
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
