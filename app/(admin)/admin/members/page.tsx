import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, avatarUrl } from "@/components/rank-badge";
import { MemberRowActions } from "./member-row-actions";

export default async function AdminMembersPage() {
  const members = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight">Members</h1>
      <div className="space-y-2.5">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3.5">
              <div className="flex items-center gap-3">
                <Avatar name={member.name} imageUrl={avatarUrl(member)} />
                <div>
                  <p className="font-semibold">
                    {member.name}{" "}
                    {member.role === "ADMIN" && (
                      <Badge variant="outline" className="ml-1">
                        Admin
                      </Badge>
                    )}
                    {member.status === "DISABLED" && (
                      <Badge variant="destructive" className="ml-1">
                        Disabled
                      </Badge>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
              </div>
              <MemberRowActions userId={member.id} role={member.role} status={member.status} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
