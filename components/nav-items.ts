import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Trophy,
  History,
  User,
  ShieldCheck,
  Users,
  Mail,
  RefreshCw,
  ClipboardList,
  Settings,
  MessageCircle,
  ScrollText,
  Vote,
  Flag,
  Megaphone,
  Medal,
  ListOrdered,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Payment submission, prize transparency, and the leaderboard all live on the
// Game Week detail page rather than as separate routes — one place to look,
// which fits a small private league better than a fragmented nav.
export const MEMBER_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/gameweeks", label: "Game Weeks", icon: Trophy },
  { href: "/leaderboard", label: "Leaderboard", icon: Medal },
  { href: "/fpl-league", label: "FPL League", icon: ListOrdered },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/rules", label: "Rules", icon: ScrollText },
  { href: "/proposals", label: "Proposals", icon: Vote },
  { href: "/history", label: "History", icon: History },
  { href: "/complaints", label: "Complaints", icon: Flag },
  { href: "/profile", label: "Profile", icon: User },
];

// Mobile gets the five screens people actually open day to day. Labels are
// kept short so they fit the bottom bar on one line without wrapping.
export const MEMBER_BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/gameweeks", label: "Games", icon: Trophy },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/proposals", label: "Vote", icon: Vote },
  { href: "/profile", label: "Profile", icon: User },
];

// An admin is also a league member, so their nav is a single unified list:
// the admin-only tools first, then the shared/social pages (which have no
// admin-specific route and link to the member ones — those pages surface the
// admin's extra powers, like deleting any chat message, on their own).
// Because the whole shell picks nav by *role* rather than by which route
// group you're in, an admin never gets dumped into the member sidebar (e.g.
// when opening notifications), which is why there's no "switch view" toggle.
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Overview", icon: ShieldCheck },
  { href: "/admin/gameweeks", label: "Game Weeks", icon: Trophy },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/invites", label: "Invites", icon: Mail },
  { href: "/admin/fpl-sync", label: "FPL Sync", icon: RefreshCw },
  { href: "/admin/audit-log", label: "Audit Log", icon: ClipboardList },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/leaderboard", label: "Leaderboard", icon: Medal },
  { href: "/fpl-league", label: "FPL League", icon: ListOrdered },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/rules", label: "Rules", icon: ScrollText },
  { href: "/proposals", label: "Proposals", icon: Vote },
  { href: "/admin/complaints", label: "Complaints", icon: Flag },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: User },
];

// The four an admin reaches for most on a phone; the rest are one tap away in
// the hamburger drawer.
export const ADMIN_BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Overview", icon: ShieldCheck },
  { href: "/admin/gameweeks", label: "Games", icon: Trophy },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/admin/members", label: "Members", icon: Users },
];
