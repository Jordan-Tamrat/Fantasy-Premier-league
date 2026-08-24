"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createRuleSectionAction, updateRuleSectionAction, deleteRuleSectionAction } from "./actions";

export function NewRuleSectionForm() {
  const [error, formAction, isPending] = useActionState(createRuleSectionAction, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="title">Section title</Label>
        <Input id="title" name="title" required placeholder="e.g. Tie-Breaking" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Rule text</Label>
        <Textarea id="body" name="body" required rows={3} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding…" : "Add section"}
      </Button>
    </form>
  );
}

export function EditRuleSectionForm({
  sectionId,
  title,
  body,
}: {
  sectionId: string;
  title: string;
  body: string;
}) {
  const action = updateRuleSectionAction.bind(null, sectionId);
  const [message, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-2">
      <Input name="title" defaultValue={title} required />
      <Textarea name="body" defaultValue={body} rows={3} required />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" variant="outline" disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
        {message && <span className="text-xs text-muted-foreground">{message}</span>}
      </div>
    </form>
  );
}

export function DeleteRuleSectionButton({ sectionId }: { sectionId: string }) {
  return (
    <form action={deleteRuleSectionAction.bind(null, sectionId)}>
      <Button type="submit" variant="ghost" size="icon-sm" aria-label="Delete section">
        <Trash2 className="size-4" />
      </Button>
    </form>
  );
}
