import Link from "next/link";
import { CheckCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listNotifications } from "@/services/notificationService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { markAllReadAction } from "./actions";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await listNotifications(user.id);
  const hasUnread = notifications.some((n) => !n.readAt);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        {hasUnread && (
          <form action={markAllReadAction}>
            <Button type="submit" variant="outline" size="sm">
              <CheckCheck className="size-4" /> Mark all read
            </Button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">Nothing here yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const body = (
              <Card className={cn("transition-colors", !n.readAt && "border-primary/40 bg-primary/5")}>
                <CardContent className="py-3.5">
                  <div className="flex items-start gap-2">
                    {!n.readAt && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{n.title}</p>
                      {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">{n.createdAt.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
            return n.href ? (
              <Link key={n.id} href={n.href}>
                {body}
              </Link>
            ) : (
              <div key={n.id}>{body}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
