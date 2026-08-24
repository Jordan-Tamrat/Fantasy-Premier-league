import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  OPEN: "Open for payment",
  PAYMENT_CLOSED: "Payment closed",
  LOCKED: "🔒 Locked",
  LIVE: "● Live",
  RESULTS_PENDING: "Awaiting results",
  PRIZES_PENDING: "Prizes pending",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

// Color-coded per status, not tied to the generic shadcn Badge palette —
// legible on both white cards and the purple hero banner.
const STATUS_CLASSES: Record<string, string> = {
  DRAFT: "bg-white/15 text-current border-transparent",
  OPEN: "bg-[var(--fpl-green)]/20 text-[var(--fpl-green)] border-[var(--fpl-green)]/30",
  PAYMENT_CLOSED: "bg-[var(--fpl-cyan)]/20 text-[var(--fpl-cyan)] border-[var(--fpl-cyan)]/30",
  LOCKED: "bg-white/15 text-current border-white/20",
  LIVE: "bg-[var(--fpl-pink)]/20 text-[var(--fpl-pink)] border-[var(--fpl-pink)]/30 animate-pulse",
  RESULTS_PENDING: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  PRIZES_PENDING: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  COMPLETED: "bg-[var(--fpl-green)]/20 text-[var(--fpl-green)] border-[var(--fpl-green)]/30",
  CANCELLED: "bg-destructive/15 text-destructive border-destructive/25",
};

export function GameWeekStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-bold whitespace-nowrap",
        STATUS_CLASSES[status] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
