import { Megaphone } from "lucide-react";
import { listAnnouncements } from "@/services/announcementService";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/datetime";

export default async function AnnouncementsPage() {
  const announcements = await listAnnouncements();

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
      {announcements.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">No announcements yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="py-4">
                <div className="flex items-start gap-2.5">
                  <Megaphone className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="font-bold">{a.title}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{a.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {a.author.name} · {formatDateTime(a.createdAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
