import { cn } from "@/lib/utils";

const RANK_STYLES: Record<number, string> = {
  1: "bg-[var(--gold)] text-white shadow-[0_0_12px_-2px_var(--gold)]",
  2: "bg-[var(--silver)] text-white",
  3: "bg-[var(--bronze)] text-white",
};

export function RankBadge({ rank }: { rank: number }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-black",
        RANK_STYLES[rank] ?? "bg-muted text-muted-foreground",
      )}
    >
      {rank}
    </span>
  );
}

export function Avatar({ name }: { name: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
      {initials}
    </span>
  );
}
