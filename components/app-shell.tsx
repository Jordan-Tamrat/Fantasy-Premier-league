"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Bell, ShieldCheck, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";
import { MEMBER_NAV_ITEMS, MEMBER_BOTTOM_NAV_ITEMS, ADMIN_NAV_ITEMS } from "@/components/nav-items";

interface AppShellProps {
  variant: "member" | "admin";
  userName: string;
  isAdmin: boolean;
  unreadCount: number;
  children: React.ReactNode;
}

// nav item arrays (which include Lucide icon *component references*) are
// picked here, inside the Client Component, rather than passed in as a prop
// from the server layout — React Server Components can't serialize function
// values like a component reference across the server->client boundary.
export function AppShell({ variant, userName, isAdmin, unreadCount, children }: AppShellProps) {
  const navItems = variant === "admin" ? ADMIN_NAV_ITEMS : MEMBER_NAV_ITEMS;
  const bottomNavItems = variant === "admin" ? ADMIN_NAV_ITEMS.slice(0, 4) : MEMBER_BOTTOM_NAV_ITEMS;
  const pathname = usePathname();
  const handleSignOut = () => signOut({ redirectTo: "/login" });

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2.5 px-6 py-6">
          <BrandMark />
          <span className="flex-1 text-[15px] font-bold tracking-tight">Money League</span>
          <NotificationBell unreadCount={unreadCount} />
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition-all",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className={cn("size-4.5", active && "text-[var(--fpl-green)]")} />
                {item.label}
                {active && <span className="ml-auto size-1.5 rounded-full bg-[var(--fpl-green)]" />}
              </Link>
            );
          })}
        </nav>
        {isAdmin && (
          <div className="px-3 pb-1">
            <Link
              href={variant === "admin" ? "/dashboard" : "/admin/dashboard"}
              className="flex items-center gap-3 rounded-full border border-sidebar-border px-4 py-2.5 text-sm font-semibold text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              {variant === "admin" ? <ArrowLeftRight className="size-4.5" /> : <ShieldCheck className="size-4.5" />}
              {variant === "admin" ? "Switch to member view" : "Admin panel"}
            </Link>
          </div>
        )}
        <div className="m-3 flex items-center justify-between rounded-2xl bg-sidebar-accent/60 p-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--fpl-green)] text-xs font-bold text-[var(--fpl-purple)]">
              {initials(userName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{userName}</p>
              {isAdmin && <p className="text-xs text-sidebar-foreground/60">Admin</p>}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleSignOut}
            aria-label="Sign out"
            className="shrink-0 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between bg-fpl-hero px-4 py-3.5 text-white md:hidden">
          <div className="flex items-center gap-2">
            <BrandMark size="sm" />
            <span className="text-sm font-bold tracking-tight">Money League</span>
          </div>
          <div className="flex items-center gap-1">
            {isAdmin && (
              <Link
                href={variant === "admin" ? "/dashboard" : "/admin/dashboard"}
                aria-label={variant === "admin" ? "Switch to member view" : "Admin panel"}
                className="flex size-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                {variant === "admin" ? <ArrowLeftRight className="size-4.5" /> : <ShieldCheck className="size-4.5" />}
              </Link>
            )}
            <NotificationBell unreadCount={unreadCount} onDark />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleSignOut}
              aria-label="Sign out"
              className="text-white/80 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden pb-24 md:pb-0">{children}</main>

        <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-full border border-border/60 bg-card/90 px-1 py-1.5 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.25)] backdrop-blur-lg md:hidden">
          {bottomNavItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[11px] font-semibold transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full transition-colors",
                    active && "bg-primary",
                  )}
                >
                  <item.icon className={cn("size-[18px]", active ? "text-primary-foreground" : "text-muted-foreground")} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function NotificationBell({ unreadCount, onDark }: { unreadCount: number; onDark?: boolean }) {
  return (
    <Link
      href="/notifications"
      aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
      className={cn(
        "relative flex size-8 items-center justify-center rounded-full transition-colors",
        onDark ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-sidebar-foreground/70 hover:bg-sidebar-accent",
      )}
    >
      <Bell className="size-4.5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-[var(--fpl-pink)] px-1 text-[10px] font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const chars = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0];
  return chars.toUpperCase();
}
