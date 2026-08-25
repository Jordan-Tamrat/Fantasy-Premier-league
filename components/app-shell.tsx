"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Bell, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";
import { APP_NAME } from "@/lib/brand";
import {
  MEMBER_NAV_ITEMS,
  MEMBER_BOTTOM_NAV_ITEMS,
  ADMIN_NAV_ITEMS,
  ADMIN_BOTTOM_NAV_ITEMS,
  type NavItem,
} from "@/components/nav-items";

interface AppShellProps {
  variant: "member" | "admin";
  userName: string;
  isAdmin: boolean;
  unreadCount: number;
  children: React.ReactNode;
}

// Nav is chosen by the user's *role*, not by which route group rendered the
// shell. That way an admin sees the same (admin) sidebar everywhere — opening
// notifications or chat never flips them into the member view — and there's
// no need for a "switch view" toggle. Nav item arrays hold Lucide icon
// component references, which can't cross the server->client boundary as
// props, so they're picked here inside the Client Component from `isAdmin`.
export function AppShell({ userName, isAdmin, unreadCount, children }: AppShellProps) {
  const navItems = isAdmin ? ADMIN_NAV_ITEMS : MEMBER_NAV_ITEMS;
  const bottomNavItems = isAdmin ? ADMIN_BOTTOM_NAV_ITEMS : MEMBER_BOTTOM_NAV_ITEMS;
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const handleSignOut = () => signOut({ redirectTo: "/login" });

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2.5 px-6 py-6">
          <BrandMark />
          <span className="flex-1 text-[13px] font-bold leading-tight tracking-tight">{APP_NAME}</span>
          <NotificationBell unreadCount={unreadCount} />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </nav>
        <UserCard userName={userName} isAdmin={isAdmin} onSignOut={handleSignOut} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between bg-fpl-hero px-4 py-3.5 text-white md:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="flex size-8 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10"
            >
              <Menu className="size-5" />
            </button>
            <BrandMark size="sm" />
            <span className="text-[13px] font-bold leading-tight tracking-tight">{APP_NAME}</span>
          </div>
          <div className="flex items-center gap-1">
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
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[11px] font-semibold whitespace-nowrap transition-colors",
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

      {/* Mobile drawer: the full nav, since the phone layout has no sidebar and
          the bottom bar only holds a few items. This is what makes every page
          (admin tools included) reachable on a phone. */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-sidebar text-sidebar-foreground shadow-xl">
            <div className="flex items-center gap-2.5 px-5 py-5">
              <BrandMark />
              <span className="flex-1 text-[13px] font-bold leading-tight tracking-tight">{APP_NAME}</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="flex size-8 items-center justify-center rounded-full text-sidebar-foreground/70 hover:bg-sidebar-accent"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isActive(item.href)}
                  onClick={() => setDrawerOpen(false)}
                />
              ))}
            </nav>
            <UserCard userName={userName} isAdmin={isAdmin} onSignOut={handleSignOut} />
          </div>
        </div>
      )}
    </div>
  );
}

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
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
}

function UserCard({ userName, isAdmin, onSignOut }: { userName: string; isAdmin: boolean; onSignOut: () => void }) {
  return (
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
        onClick={onSignOut}
        aria-label="Sign out"
        className="shrink-0 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <LogOut className="size-4" />
      </Button>
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
