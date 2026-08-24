import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getInviteByToken } from "@/services/inviteService";
import { AcceptInviteForm } from "./accept-invite-form";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await getInviteByToken(token);

  if (!invite) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invite not valid</CardTitle>
          <CardDescription>This invite link has expired, been used, or was revoked. Ask the league admin for a new one.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Join Fantasy Money League</CardTitle>
        <CardDescription>You&apos;ve been invited as {invite.email}. Set your name and password.</CardDescription>
      </CardHeader>
      <CardContent>
        <AcceptInviteForm token={token} />
      </CardContent>
    </Card>
  );
}
