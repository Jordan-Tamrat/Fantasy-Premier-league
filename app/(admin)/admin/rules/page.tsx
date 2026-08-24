import { listRuleSections } from "@/services/ruleService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewRuleSectionForm, EditRuleSectionForm, DeleteRuleSectionButton } from "./rule-forms";

export default async function AdminRulesPage() {
  const sections = await listRuleSections();

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight">League Rules</h1>
      <p className="text-sm text-muted-foreground">
        Every edit records the previous wording in the audit log, so past rules are never silently overwritten.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a section</CardTitle>
        </CardHeader>
        <CardContent>
          <NewRuleSectionForm />
        </CardContent>
      </Card>

      <div className="space-y-2">
        {sections.map((section) => (
          <Card key={section.id}>
            <CardContent className="space-y-2 py-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Updated {section.updatedAt.toLocaleDateString()}
                </p>
                <DeleteRuleSectionButton sectionId={section.id} />
              </div>
              <EditRuleSectionForm sectionId={section.id} title={section.title} body={section.body} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
