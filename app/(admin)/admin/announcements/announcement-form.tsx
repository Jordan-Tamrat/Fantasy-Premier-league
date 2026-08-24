"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createAnnouncementAction } from "./actions";

export function AnnouncementForm() {
  const [error, formAction, isPending] = useActionState(createAnnouncementAction, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required placeholder="e.g. GW6 payment is now open" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Message</Label>
        <Textarea id="body" name="body" required rows={3} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        This posts to the chat and notifies every member.
      </p>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Posting…" : "Post announcement"}
      </Button>
    </form>
  );
}
