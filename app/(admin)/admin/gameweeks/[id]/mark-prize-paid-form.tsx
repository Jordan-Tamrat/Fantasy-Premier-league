"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from "@/lib/uploadLimits";
import { markPrizePaymentPaidAction } from "./actions";

export function MarkPrizePaidForm({ gameWeekId, prizePaymentId }: { gameWeekId: string; prizePaymentId: string }) {
  const action = markPrizePaymentPaidAction.bind(null, gameWeekId, prizePaymentId);
  const [error, formAction, isPending] = useActionState(action, undefined);
  const [fileError, setFileError] = useState<string | null>(null);

  return (
    <form action={formAction} className="mt-2 flex flex-wrap items-center gap-2">
      <select name="method" defaultValue="TELEBIRR" className="h-8 rounded-md border bg-background px-2 text-sm">
        <option value="TELEBIRR">Telebirr</option>
        <option value="CBE">CBE</option>
      </select>
      <Input name="referenceNumber" placeholder="Reference #" className="h-8 w-32" />
      <input
        name="proof"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="text-xs"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && file.size > MAX_UPLOAD_BYTES) {
            setFileError(`Image is too large (max ${MAX_UPLOAD_MB}MB).`);
            e.target.value = "";
            return;
          }
          setFileError(null);
        }}
      />
      <Button size="sm" type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Mark paid"}
      </Button>
      {fileError && <p className="w-full text-destructive">{fileError}</p>}
      {error && <p className="w-full text-destructive">{error}</p>}
    </form>
  );
}
