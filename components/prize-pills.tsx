import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { MoneyInput } from "@/lib/money";

const MEDAL_STYLES: Record<number, string> = {
  1: "bg-[var(--gold)]/15 text-[var(--gold)] border-[var(--gold)]/30",
  2: "bg-[var(--silver)]/15 text-[color-mix(in_oklab,var(--silver)_75%,black)] border-[var(--silver)]/30",
  3: "bg-[var(--bronze)]/15 text-[var(--bronze)] border-[var(--bronze)]/30",
};

const MEDAL_EMOJI: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export function PrizePills({ positions }: { positions: { position: number; amount: MoneyInput }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {positions.map((p) => (
        <span
          key={p.position}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold",
            MEDAL_STYLES[p.position] ?? "border-border bg-secondary text-secondary-foreground",
          )}
        >
          <span>{MEDAL_EMOJI[p.position] ?? `#${p.position}`}</span>
          {formatMoney(p.amount)}
        </span>
      ))}
    </div>
  );
}
