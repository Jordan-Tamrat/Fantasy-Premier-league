import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatChip({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  tone?: "default" | "green" | "pink" | "cyan";
}) {
  const toneClasses: Record<string, string> = {
    default: "bg-secondary text-secondary-foreground",
    green: "bg-[var(--fpl-green)]/15 text-[var(--fpl-green)]",
    pink: "bg-[var(--fpl-pink)]/15 text-[var(--fpl-pink)]",
    cyan: "bg-[var(--fpl-cyan)]/15 text-[color-mix(in_oklab,var(--fpl-cyan)_75%,black)]",
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card px-3.5 py-3 shadow-sm">
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", toneClasses[tone])}>
        <Icon className="size-4.5" strokeWidth={2.25} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-bold">{value}</p>
      </div>
    </div>
  );
}
