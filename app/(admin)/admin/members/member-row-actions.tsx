"use client";

import { useState, useTransition } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setMemberRoleAction, setMemberStatusAction, createPasswordResetLinkAction } from "./actions";

export function MemberRowActions({
  userId,
  role,
  status,
}: {
  userId: string;
  role: "ADMIN" | "MEMBER";
  status: "ACTIVE" | "DISABLED";
}) {
  const [isPending, startTransition] = useTransition();
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleReset = () => {
    setCopied(false);
    startTransition(async () => {
      const path = await createPasswordResetLinkAction(userId);
      setResetLink(`${window.location.origin}${path}`);
    });
  };

  const copyLink = async () => {
    if (!resetLink) return;
    try {
      await navigator.clipboard.writeText(resetLink);
      setCopied(true);
    } catch {
      // Clipboard can be blocked; the link stays selectable on screen.
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => startTransition(() => setMemberRoleAction(userId, role === "ADMIN" ? "MEMBER" : "ADMIN"))}
        >
          {role === "ADMIN" ? "Make member" : "Make admin"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(() => setMemberStatusAction(userId, status === "ACTIVE" ? "DISABLED" : "ACTIVE"))
          }
        >
          {status === "ACTIVE" ? "Disable" : "Enable"}
        </Button>
        <Button variant="outline" size="sm" disabled={isPending} onClick={handleReset}>
          {isPending ? "Generating…" : "Reset password"}
        </Button>
      </div>

      {resetLink && (
        <div className="flex w-full max-w-md items-center gap-2 rounded-lg bg-muted px-2.5 py-1.5">
          <code className="flex-1 truncate text-xs">{resetLink}</code>
          <button
            type="button"
            onClick={copyLink}
            aria-label="Copy reset link"
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
          >
            {copied ? <Check className="size-3.5 text-[var(--fpl-green)]" /> : <Copy className="size-3.5" />}
          </button>
        </div>
      )}
      {resetLink && (
        <p className="text-xs text-muted-foreground">Send this to them — it works once and expires in 24 hours.</p>
      )}
    </div>
  );
}
