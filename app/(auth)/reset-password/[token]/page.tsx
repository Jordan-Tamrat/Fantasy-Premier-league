import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getValidResetToken } from "@/services/passwordResetService";
import { ResetForm } from "./reset-form";

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const reset = await getValidResetToken(token);

  if (!reset) {
    return (
      <Card className="rounded-3xl border-white/20 bg-white/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Link not valid</CardTitle>
          <CardDescription>
            This reset link has expired, was already used, or has been replaced by a newer one. Ask the league admin
            for a fresh link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className="text-sm font-semibold text-primary hover:underline">
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border-white/20 bg-white/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      <CardContent className="p-6">
        <div className="mb-5">
          <h2 className="text-lg font-bold tracking-tight">Set a new password</h2>
          <p className="text-sm text-muted-foreground">Resetting the password for {reset.user.email}.</p>
        </div>
        <ResetForm token={token} />
      </CardContent>
    </Card>
  );
}
