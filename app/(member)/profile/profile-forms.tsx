"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from "@/lib/uploadLimits";
import { compressImage } from "@/lib/image-compress";
import {
  updateProfileAction,
  updateProfilePictureAction,
  linkFplAccountAction,
  unlinkFplAccountAction,
} from "./actions";

export function ProfilePictureForm({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  const [error, formAction, isPending] = useActionState(updateProfilePictureAction, undefined);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  // A local preview of the just-picked image so the new avatar appears
  // instantly, instead of waiting for the upload + revalidation round-trip.
  const [preview, setPreview] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const shownImage = preview ?? imageUrl;

  return (
    <form
      action={formAction}
      onChange={async (e) => {
        const input = e.target as unknown as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        setSizeError(null);

        // Profile pictures only ever need to look good at avatar size, so
        // downscale + re-encode client-side rather than rejecting a normal
        // phone photo outright — a 4000x3000 camera shot easily lands well
        // under the limit once resized to 512px.
        setIsCompressing(true);
        const optimized = await compressImage(file, { maxDimension: 512, quality: 0.85 });
        setIsCompressing(false);

        if (optimized.size > MAX_UPLOAD_BYTES) {
          setSizeError(`Image is too large (max ${MAX_UPLOAD_MB}MB).`);
          input.value = "";
          return;
        }

        setPreview(URL.createObjectURL(optimized));
        const formData = new FormData();
        formData.set("image", optimized);
        startTransition(() => formAction(formData));
      }}
    >
      <label htmlFor="image" className="group relative block size-16 cursor-pointer">
        <div className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-[var(--fpl-green)] text-xl font-black text-[var(--fpl-purple)] shadow-[0_0_24px_-4px_var(--fpl-green)]">
          {shownImage ? (
            <Image src={shownImage} alt={name} width={64} height={64} unoptimized className="size-full object-cover" />
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
      {isCompressing && <p className="mt-1 text-xs text-white/70">Optimizing…</p>}
      {isPending && <p className="mt-1 text-xs text-white/70">Uploading…</p>}
      {sizeError && <p className="mt-1 text-xs text-[var(--fpl-pink)]">{sizeError}</p>}
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
