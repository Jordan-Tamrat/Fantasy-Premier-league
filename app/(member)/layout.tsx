import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { AutoRefresh } from "@/components/auto-refresh";
import { getUnreadCount } from "@/services/notificationService";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const unreadCount = await getUnreadCount(session.user.id);

  return (
    <AppShell
      variant="member"
      userName={session.user.name ?? session.user.email ?? "Member"}
      isAdmin={session.user.role === "ADMIN"}
      unreadCount={unreadCount}
    >
      <AutoRefresh />
      {children}
    </AppShell>
  );
}
