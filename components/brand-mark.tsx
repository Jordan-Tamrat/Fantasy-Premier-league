import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-[var(--fpl-green)] text-[var(--fpl-purple)] shadow-[0_0_16px_-4px_var(--fpl-green)]",
        size === "sm" ? "size-7" : "size-9",
      )}
    >
      <Trophy className={size === "sm" ? "size-3.5" : "size-4.5"} strokeWidth={2.5} />
    </span>
  );
}
