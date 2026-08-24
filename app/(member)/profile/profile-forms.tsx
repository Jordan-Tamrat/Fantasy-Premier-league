"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction, linkFplAccountAction, unlinkFplAccountAction } from "./actions";

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
