"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MEMBER_NAV_ITEMS, MEMBER_BOTTOM_NAV_ITEMS, ADMIN_NAV_ITEMS } from "@/components/nav-items";

interface AppShellProps {
  variant: "member" | "admin";
  userName: string;
  isAdmin: boolean;
  children: React.ReactNode;
}

// nav item arrays (which include Lucide icon *component references*) are
// picked here, inside the Client Component, rather than passed in as a prop
// from the server layout — React Server Components can't serialize function
// values like a component reference across the server->client boundary.
export function AppShell({ variant, userName, isAdmin, children }: AppShellProps) {
  const navItems = variant === "admin" ? ADMIN_NAV_ITEMS : MEMBER_NAV_ITEMS;
  const bottomNavItems = variant === "admin" ? ADMIN_NAV_ITEMS.slice(0, 4) : MEMBER_BOTTOM_NAV_ITEMS;
  const pathname = usePathname();
  const handleSignOut = () => signOut({ redirectTo: "/login" });

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <Trophy className="size-5 text-primary" />
          <span className="font-semibold">Money League</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{userName}</p>
              {isAdmin && <p className="text-xs text-muted-foreground">Admin</p>}
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <Trophy className="size-5 text-primary" />
            <span className="font-semibold">Money League</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
            <LogOut className="size-4" />
          </Button>
        </header>

        <main className="flex-1 overflow-x-hidden pb-20 md:pb-0">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 flex border-t bg-background md:hidden">
          {bottomNavItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
