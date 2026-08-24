import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { MEMBER_NAV_ITEMS, MEMBER_BOTTOM_NAV_ITEMS } from "@/components/nav-items";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AppShell
      navItems={MEMBER_NAV_ITEMS}
      bottomNavItems={MEMBER_BOTTOM_NAV_ITEMS}
      userName={session.user.name ?? session.user.email ?? "Member"}
      isAdmin={session.user.role === "ADMIN"}
    >
      {children}
    </AppShell>
  );
}
