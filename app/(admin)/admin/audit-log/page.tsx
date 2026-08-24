import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminAuditLogPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-8">
      <h1 className="text-2xl font-semibold">Audit Log</h1>
      <div className="space-y-2">
        {logs.map((log) => (
          <Card key={log.id}>
            <CardContent className="py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{log.action}</span>
                <span className="text-xs text-muted-foreground">{log.createdAt.toLocaleString()}</span>
              </div>
              <p className="text-muted-foreground">
                {log.actor?.name ?? log.actorLabel ?? "System"} · {log.entityType} #{log.entityId.slice(0, 8)}
              </p>
              {log.reason && <p className="mt-1 italic text-muted-foreground">&quot;{log.reason}&quot;</p>}
            </CardContent>
          </Card>
        ))}
        {logs.length === 0 && <p className="text-muted-foreground">No activity yet.</p>}
      </div>
    </div>
  );
}
