"use client";

import { useActionState, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from "@/lib/uploadLimits";
import { submitPaymentAction } from "./actions";

export function PaymentForm({ gameWeekId }: { gameWeekId: string }) {
  const action = submitPaymentAction.bind(null, gameWeekId);
  const [error, formAction, isPending] = useActionState(action, undefined);
  const [method, setMethod] = useState<"TELEBIRR" | "CBE">("TELEBIRR");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label>Payment method</Label>
        <input type="hidden" name="method" value={method} />
        <div className="grid grid-cols-2 gap-2">
          {(["TELEBIRR", "CBE"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={cn(
                "rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-colors",
                method === m
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40",
              )}
            >
              {m === "TELEBIRR" ? "Telebirr" : "CBE"}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="screenshot">Payment screenshot</Label>
        <label
          htmlFor="screenshot"
          className="flex cursor-pointer items-center gap-2.5 rounded-xl border-2 border-dashed border-border px-3.5 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50"
        >
          <Upload className="size-4 shrink-0" />
          <span className="truncate">{fileName ?? "Tap to attach a screenshot"}</span>
        </label>
        <input
          id="screenshot"
          name="screenshot"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          required
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
      </div>
      {fileError && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{fileError}</p>}
      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="w-full font-bold" disabled={isPending}>
        {isPending ? "Submitting…" : "Submit payment"}
      </Button>
    </form>
  );
}
