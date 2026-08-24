"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateLeagueSettingsAction } from "./actions";
import type { LeagueSettings } from "@/lib/generated/prisma/client";

export function SettingsForm({ settings }: { settings: LeagueSettings | null }) {
  const [message, formAction, isPending] = useActionState(updateLeagueSettingsAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="leagueName" label="League name" defaultValue={settings?.leagueName ?? "Fantasy Money League"} />
        <Field id="currency" label="Currency" defaultValue={settings?.currency ?? "ETB"} />
        <Field
          id="defaultEntryFee"
          label="Default entry fee"
          type="number"
          defaultValue={settings ? settings.defaultEntryFee.toString() : "100"}
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
