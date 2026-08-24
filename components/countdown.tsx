"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return days > 0 ? `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function Countdown({ label, target }: { label: string; target: Date }) {
  const targetTime = target.getTime();
  const [remaining, setRemaining] = useState(() => targetTime - Date.now());

  useEffect(() => {
    const interval = setInterval(() => setRemaining(targetTime - Date.now()), 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const isPast = remaining <= 0;

  return (
    <div className={`rounded-md border px-3 py-2 text-sm ${isPast ? "border-destructive/40 bg-destructive/10" : "border-primary/30 bg-primary/5"}`}>
      {isPast ? (
        <span className="font-medium">🔒 {label} passed</span>
      ) : (
        <>
          <span className="text-muted-foreground">{label}: </span>
          <span className="font-mono font-medium">{formatRemaining(remaining)}</span>
          <span className="text-muted-foreground"> remaining</span>
        </>
      )}
    </div>
  );
}
