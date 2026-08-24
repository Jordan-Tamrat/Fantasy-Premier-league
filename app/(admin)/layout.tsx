import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { getUnreadCount } from "@/services/notificationService";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const unreadCount = await getUnreadCount(session.user.id);

  return (
    <AppShell variant="admin" userName={session.user.name ?? "Admin"} isAdmin unreadCount={unreadCount}>
      {children}
    </AppShell>
  );
}
