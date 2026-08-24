"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function formatRemaining(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return days > 0
    ? `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function Countdown({
  label,
  target,
  variant = "card",
}: {
  label: string;
  target: Date;
  variant?: "card" | "hero";
}) {
  const targetTime = target.getTime();
  const [remaining, setRemaining] = useState(() => targetTime - Date.now());

  useEffect(() => {
    const interval = setInterval(() => setRemaining(targetTime - Date.now()), 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const isPast = remaining <= 0;
  const urgent = !isPast && remaining < 60 * 60 * 1000;

  if (variant === "hero") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
        {isPast ? (
          <span className="text-sm font-semibold text-white">🔒 {label} passed</span>
        ) : (
          <>
            <span className="text-xs font-medium text-white/60">{label}</span>
            <span className={cn("font-mono text-sm font-bold tabular-nums", urgent ? "text-[var(--fpl-pink)]" : "text-[var(--fpl-green)]")}>
              {formatRemaining(remaining)}
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border px-3.5 py-2.5 text-sm",
        isPast ? "border-destructive/30 bg-destructive/10" : urgent ? "border-[var(--fpl-pink)]/30 bg-[var(--fpl-pink)]/10" : "border-primary/30 bg-primary/10",
      )}
    >
      {isPast ? (
        <span className="font-semibold">🔒 {label} passed</span>
      ) : (
        <>
          <span className="text-muted-foreground">{label}: </span>
          <span className={cn("font-mono font-bold tabular-nums", urgent ? "text-[var(--fpl-pink)]" : "text-foreground")}>
            {formatRemaining(remaining)}
          </span>
          <span className="text-muted-foreground"> remaining</span>
        </>
      )}
    </div>
  );
}
