"use client";

import { useActionState, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "./actions";

function ResetSuccessBanner() {
  const justReset = useSearchParams().get("reset") === "1";
  if (!justReset) return null;
  return (
    <p className="mb-4 rounded-lg bg-[var(--fpl-green)]/15 px-3 py-2 text-sm font-medium">
      Password updated — sign in with your new password.
    </p>
  );
}

export default function LoginPage() {
  const [error, formAction, isPending] = useActionState(loginAction, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Card className="rounded-3xl border-white/20 bg-white/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      <CardContent className="p-6">
        <div className="mb-5">
          <h2 className="text-lg font-bold tracking-tight">Welcome back</h2>
          <p className="text-sm text-muted-foreground">Sign in to your league account</p>
        </div>

        {/* Reading search params opts a route out of prerendering unless it's
            inside a Suspense boundary, so the banner is isolated here. */}
        <Suspense fallback={null}>
          <ResetSuccessBanner />
        </Suspense>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
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
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{error}</p>
          )}
          <Button type="submit" size="lg" className="w-full gap-2 font-bold" disabled={isPending}>
            {isPending ? (
              "Signing in…"
            ) : (
              <>
                <LogIn className="size-4.5" />
                Sign in
              </>
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/forgot-password" className="font-semibold text-primary hover:underline">
            Forgot your password?
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
