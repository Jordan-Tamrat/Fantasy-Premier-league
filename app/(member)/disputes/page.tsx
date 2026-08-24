import { requireUser } from "@/lib/auth";
import { listDisputesForUser } from "@/services/disputeService";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewDisputeForm } from "./dispute-form";

export const DISPUTE_STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  OPEN: "default",
  UNDER_REVIEW: "secondary",
  RESOLVED: "outline",
  REJECTED: "destructive",
};

export default async function DisputesPage() {
  const user = await requireUser();
  const disputes = await listDisputesForUser(user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight">Disputes</h1>

      <NewDisputeForm />

      {disputes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            You haven&apos;t raised any disputes.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => (
            <Card key={d.id}>
              <CardContent className="space-y-2 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold">{d.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.category.replace("_", " ").toLowerCase()} · {d.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={DISPUTE_STATUS_VARIANTS[d.status] ?? "secondary"}>
                    {d.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="whitespace-pre-wrap text-sm">{d.description}</p>
                {d.adminResponse && (
                  <div className="rounded-lg border-l-2 border-primary bg-muted/50 px-3 py-2 text-sm">
                    <p className="text-xs font-semibold text-muted-foreground">Admin response</p>
                    <p className="whitespace-pre-wrap">{d.adminResponse}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
