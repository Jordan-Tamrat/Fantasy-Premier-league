import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AppShell
      variant="member"
      userName={session.user.name ?? session.user.email ?? "Member"}
      isAdmin={session.user.role === "ADMIN"}
    >
      {children}
    </AppShell>
  );
}
