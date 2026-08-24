import { Trash2 } from "lucide-react";
import { listAnnouncements } from "@/services/announcementService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnnouncementForm } from "./announcement-form";
import { deleteAnnouncementAction } from "./actions";

export default async function AdminAnnouncementsPage() {
  const announcements = await listAnnouncements();

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New announcement</CardTitle>
        </CardHeader>
        <CardContent>
          <AnnouncementForm />
        </CardContent>
      </Card>

      <div className="space-y-2">
        {announcements.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex items-start justify-between gap-3 py-4">
              <div className="min-w-0">
                <p className="font-bold">{a.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{a.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {a.author.name} · {a.createdAt.toLocaleString()}
                </p>
              </div>
              <form action={deleteAnnouncementAction.bind(null, a.id)}>
                <Button type="submit" variant="ghost" size="icon-sm" aria-label="Delete announcement">
                  <Trash2 className="size-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
