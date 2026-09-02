"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, KeyRound, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction } from "./actions";

export default function ForgotPasswordPage() {
  const [error, formAction, isPending] = useActionState(resetPasswordAction, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Card className="rounded-3xl border-white/20 bg-white/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      <CardContent className="p-6">
        <div className="mb-5">
          <h2 className="text-lg font-bold tracking-tight">Reset your password</h2>
          <p className="text-sm text-muted-foreground">
            Confirm it&apos;s you with the FPL Entry ID linked to your account, then choose a new password.
          </p>
        </div>

        {/* Surfaced up-front, not as fine print at the bottom: a member who
            never linked a team cannot use this form at all, and would
            otherwise only find out after filling it in and hitting a generic
            "details don't match" error. */}
        <div className="mb-5 flex gap-2.5 rounded-xl border border-[var(--fpl-cyan)]/40 bg-[var(--fpl-cyan)]/10 px-3.5 py-3">
          <Info className="mt-0.5 size-4.5 shrink-0 text-[var(--fpl-purple)]" />
          <p className="text-sm">
            <span className="font-bold">Haven&apos;t linked your FPL team yet?</span> This page can&apos;t verify you
            — message the admin and they&apos;ll send you a personal reset link.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fplEntryId">FPL Entry ID</Label>
            <Input id="fplEntryId" name="fplEntryId" type="number" required placeholder="e.g. 1234567" />
            <p className="text-xs text-muted-foreground">
              On fantasy.premierleague.com open your team → Points → the number in the URL after
              <span className="font-mono"> /entry/</span>.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <p className="font-medium">{error}</p>
              <p className="mt-1 text-xs">
                If you never linked your FPL team, this won&apos;t work — ask the admin for a reset link instead.
              </p>
            </div>
          )}

          <Button type="submit" size="lg" className="w-full gap-2 font-bold" disabled={isPending}>
            {isPending ? (
              "Resetting…"
            ) : (
              <>
                <KeyRound className="size-4.5" />
                Reset password
              </>
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
