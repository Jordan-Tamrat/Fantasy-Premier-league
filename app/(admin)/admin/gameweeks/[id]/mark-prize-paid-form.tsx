"use client";

import { useActionState, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from "@/lib/uploadLimits";
import { markPrizePaymentPaidAction } from "./actions";

export function MarkPrizePaidForm({
  gameWeekId,
  prizePaymentId,
  recipientTelebirr,
  recipientCbe,
}: {
  gameWeekId: string;
  prizePaymentId: string;
  recipientTelebirr: string | null;
  recipientCbe: string | null;
}) {
  const action = markPrizePaymentPaidAction.bind(null, gameWeekId, prizePaymentId);
  const [error, formAction, isPending] = useActionState(action, undefined);
  const [method, setMethod] = useState<"TELEBIRR" | "CBE">("TELEBIRR");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const recipientNumber = method === "TELEBIRR" ? recipientTelebirr : recipientCbe;
  const methodLabel = method === "TELEBIRR" ? "Telebirr" : "CBE";

  return (
    <form action={formAction} className="mt-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          name="method"
          value={method}
          onChange={(e) => setMethod(e.target.value as "TELEBIRR" | "CBE")}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          <option value="TELEBIRR">Telebirr</option>
          <option value="CBE">CBE</option>
        </select>

        {/* Where to actually send the money — the winner's own payout number,
            switching with the method dropdown. */}
        {recipientNumber ? (
          <div className="rounded-lg bg-[var(--fpl-green)]/10 px-3 py-1.5 text-sm">
            <span className="text-muted-foreground">Send to {methodLabel}: </span>
            <span className="font-bold tracking-wide">{recipientNumber}</span>
          </div>
        ) : (
          <div className="rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground">
            No {methodLabel} number on file — ask them to add it under Profile → Your payout details.
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label
          htmlFor={`proof-${prizePaymentId}`}
          className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50"
        >
          <Upload className="size-4 shrink-0" />
          <span className="max-w-48 truncate">{fileName ?? "Attach payment screenshot"}</span>
        </label>
        <input
          id={`proof-${prizePaymentId}`}
          name="proof"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && file.size > MAX_UPLOAD_BYTES) {
              setFileError(`Image is too large (max ${MAX_UPLOAD_MB}MB).`);
              setFileName(null);
              e.target.value = "";
              return;
            }
            setFileError(null);
            setFileName(file?.name ?? null);
          }}
        />
        <Button size="sm" type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Mark paid"}
        </Button>
      </div>

      {fileError && <p className="text-sm text-destructive">{fileError}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
