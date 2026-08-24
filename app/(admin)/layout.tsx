import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ADMIN_NAV_ITEMS } from "@/components/nav-items";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <AppShell
      navItems={ADMIN_NAV_ITEMS}
      bottomNavItems={ADMIN_NAV_ITEMS.slice(0, 4)}
      userName={session.user.name ?? "Admin"}
      isAdmin
    >
      {children}
    </AppShell>
  );
}
