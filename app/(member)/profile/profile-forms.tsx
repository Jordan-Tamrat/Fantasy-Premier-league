"use client";

import { useActionState, useRef, useTransition } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateProfileAction,
  updateProfilePictureAction,
  linkFplAccountAction,
  unlinkFplAccountAction,
} from "./actions";

export function ProfilePictureForm({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  const [error, formAction, isPending] = useActionState(updateProfilePictureAction, undefined);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      action={formAction}
      onChange={() => {
        const form = inputRef.current?.form;
        if (form) startTransition(() => formAction(new FormData(form)));
      }}
    >
      <label htmlFor="image" className="group relative block size-16 cursor-pointer">
        <div className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-[var(--fpl-green)] text-xl font-black text-[var(--fpl-purple)] shadow-[0_0_24px_-4px_var(--fpl-green)]">
          {imageUrl ? (
            <Image src={imageUrl} alt={name} width={64} height={64} unoptimized className="size-full object-cover" />
          ) : (
            initials(name)
          )}
        </div>
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="size-5 text-white" />
        </span>
      </label>
      <input
        ref={inputRef}
        id="image"
        name="image"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />
      {isPending && <p className="mt-1 text-xs text-white/70">Uploading…</p>}
      {error && <p className="mt-1 text-xs text-[var(--fpl-pink)]">{error}</p>}
    </form>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const chars = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0];
  return chars.toUpperCase();
}

export function PaymentMethodsForm({
  telebirrNumber,
  cbeAccountNumber,
}: {
  telebirrNumber: string | null;
  cbeAccountNumber: string | null;
}) {
  const [message, formAction, isPending] = useActionState(updateProfileAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="telebirrNumber">Telebirr number</Label>
        <Input id="telebirrNumber" name="telebirrNumber" defaultValue={telebirrNumber ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cbeAccountNumber">CBE account number</Label>
        <Input id="cbeAccountNumber" name="cbeAccountNumber" defaultValue={cbeAccountNumber ?? ""} />
      </div>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save payment methods"}
      </Button>
    </form>
  );
}

export function FplLinkForm() {
  const [error, formAction, isPending] = useActionState(linkFplAccountAction, undefined);

  return (
    <form action={formAction} className="space-y-2">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-2">
          <Label htmlFor="fplEntryId">FPL entry ID</Label>
          <Input id="fplEntryId" name="fplEntryId" type="number" required placeholder="e.g. 1234567" />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Linking…" : "Link"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}

export function UnlinkFplButton() {
  return (
    <form action={unlinkFplAccountAction}>
      <Button type="submit" variant="outline" size="sm">
        Unlink
      </Button>
    </form>
  );
}
