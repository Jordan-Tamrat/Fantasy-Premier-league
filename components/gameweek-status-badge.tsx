import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  OPEN: "Open for payment",
  PAYMENT_CLOSED: "Payment closed",
  LOCKED: "🔒 Locked",
  LIVE: "Live",
  RESULTS_PENDING: "Awaiting results",
  PRIZES_PENDING: "Prizes pending",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "outline",
  OPEN: "default",
  PAYMENT_CLOSED: "secondary",
  LOCKED: "secondary",
  LIVE: "default",
  RESULTS_PENDING: "secondary",
  PRIZES_PENDING: "secondary",
  COMPLETED: "outline",
  CANCELLED: "destructive",
};

export function GameWeekStatusBadge({ status }: { status: string }) {
  return <Badge variant={STATUS_VARIANTS[status] ?? "secondary"}>{STATUS_LABELS[status] ?? status}</Badge>;
}
