"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInviteAction } from "../members/actions";

export function InviteForm() {
  const [error, formAction, isPending] = useActionState(createInviteAction, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required placeholder="friend@example.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <select id="role" name="role" defaultValue="MEMBER" className="h-9 rounded-md border bg-background px-3 text-sm">
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Sending…" : "Create invite"}
      </Button>
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </form>
  );
}
