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
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/rules", label: "Rules", icon: ScrollText },
  { href: "/proposals", label: "Proposals", icon: Vote },
  { href: "/history", label: "History", icon: History },
  { href: "/disputes", label: "Disputes", icon: Flag },
  { href: "/profile", label: "Profile", icon: User },
];

// Mobile gets the five screens people actually open day to day.
export const MEMBER_BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/gameweeks", label: "Game Weeks", icon: Trophy },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/proposals", label: "Vote", icon: Vote },
  { href: "/profile", label: "Profile", icon: User },
];

// Payment verification and prize configuration live under each Game Week
// (/admin/gameweeks/[id]/...) rather than as their own top-level pages —
// there's realistically only ever one Game Week actively taking payments.
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Overview", icon: ShieldCheck },
  { href: "/admin/gameweeks", label: "Game Weeks", icon: Trophy },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/rules", label: "Rules", icon: ScrollText },
  { href: "/admin/disputes", label: "Disputes", icon: Flag },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/invites", label: "Invites", icon: Mail },
  { href: "/admin/fpl-sync", label: "FPL Sync", icon: RefreshCw },
  { href: "/admin/audit-log", label: "Audit Log", icon: ClipboardList },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];
