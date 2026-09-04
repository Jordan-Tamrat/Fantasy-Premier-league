"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { createDisputeAction } from "./actions";

const CATEGORIES = [
  ["PAYMENT", "Payment"],
  ["FPL_SCORE", "FPL score"],
  ["ELIGIBILITY", "Eligibility"],
  ["PRIZE", "Prize"],
  ["RULE", "Rule"],
  ["TECHNICAL", "Technical issue"],
  ["OTHER", "Other"],
] as const;

export function NewComplaintForm() {
  const [open, setOpen] = useState(false);
  const [error, formAction, isPending] = useActionState(createDisputeAction, undefined);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="w-full">
        <Plus className="size-4" /> Raise a complaint
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="py-4">
        <form action={formAction} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              name="category"
              defaultValue="PAYMENT"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
              {CATEGORIES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="Short summary" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">What happened?</Label>
            <Textarea id="description" name="description" required rows={4} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Submitting…" : "Submit complaint"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
