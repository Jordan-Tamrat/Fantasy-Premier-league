"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateLeagueSettingsAction } from "./actions";
import { APP_NAME } from "@/lib/brand";

// A plain, already-serialized view of LeagueSettings — no Prisma Decimal or
// other runtime types, so it's safe to pass from the Server Component page.
interface SettingsView {
  leagueName: string;
  currency: string;
  defaultEntryFee: string;
  defaultPaymentDeadlineOffsetHours: number;
  defaultMinParticipants: number;
  leagueAccountName: string | null;
  leagueTelebirrNumber: string | null;
  leagueCbeAccountNumber: string | null;
}

export function SettingsForm({ settings }: { settings: SettingsView | null }) {
  const [message, formAction, isPending] = useActionState(updateLeagueSettingsAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="leagueName" label="League name" defaultValue={settings?.leagueName ?? APP_NAME} />
        <Field id="currency" label="Currency" defaultValue={settings?.currency ?? "ETB"} />
        <Field
          id="defaultEntryFee"
          label="Default entry fee"
          type="number"
          defaultValue={settings?.defaultEntryFee ?? "100"}
        />
        <Field
          id="defaultPaymentDeadlineOffsetHours"
          label="Payment deadline offset (hours before FPL deadline)"
          type="number"
          defaultValue={settings?.defaultPaymentDeadlineOffsetHours ?? 2}
        />
        <Field
          id="defaultMinParticipants"
          label="Default minimum participants"
          type="number"
          defaultValue={settings?.defaultMinParticipants ?? 3}
        />
        <Field id="leagueAccountName" label="Payment account name" defaultValue={settings?.leagueAccountName ?? ""} />
        <Field id="leagueTelebirrNumber" label="Telebirr number" defaultValue={settings?.leagueTelebirrNumber ?? ""} />
        <Field id="leagueCbeAccountNumber" label="CBE account number" defaultValue={settings?.leagueCbeAccountNumber ?? ""} />
      </div>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  type = "text",
  defaultValue,
}: {
  id: string;
  label: string;
  type?: string;
  defaultValue: string | number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} type={type} defaultValue={defaultValue} required={type === "number"} />
    </div>
  );
}
