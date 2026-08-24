import { listRuleSections } from "@/services/ruleService";
import { Card, CardContent } from "@/components/ui/card";

export default async function RulesPage() {
  const sections = await listRuleSections();

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight">League Rules</h1>
      {sections.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            No rules have been published yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sections.map((section, index) => (
            <Card key={section.id}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold">{section.title}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{section.body}</p>
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
