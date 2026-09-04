"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown, Minus, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StandingRow {
  entry: number;
  entryName: string;
  playerName: string;
  rank: number;
  lastRank: number;
  eventTotal: number;
  total: number;
  /** Set when this FPL entry is linked to an account in this app. */
  memberName: string | null;
}

type SortKey = "gameweek" | "total";

export function StandingsTable({ rows, currentEvent }: { rows: StandingRow[]; currentEvent: number | null }) {
  const [sortBy, setSortBy] = useState<SortKey>("gameweek");

  // FPL's own `rank` is by season total, so only the season view can reuse it;
  // the Game Week view is re-sorted here, with total points as the tiebreak.
  const sorted = [...rows].sort((a, b) =>
    sortBy === "total" ? b.total - a.total : b.eventTotal - a.eventTotal || b.total - a.total,
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <SortTab active={sortBy === "gameweek"} onClick={() => setSortBy("gameweek")}>
          {currentEvent ? `GW${currentEvent} points` : "Game Week"}
        </SortTab>
        <SortTab active={sortBy === "total"} onClick={() => setSortBy("total")}>
          Total points
        </SortTab>
      </div>

      <div className="space-y-2">
        {sorted.map((row, index) => {
          const position = index + 1;
          const highlight = sortBy === "gameweek" ? row.eventTotal : row.total;
          const secondary = sortBy === "gameweek" ? `${row.total} total` : `${row.eventTotal} this GW`;

          return (
            <div
              key={row.entry}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm",
                row.memberName ? "border-primary/40 bg-primary/5" : "bg-card",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-black",
                  position === 1
                    ? "bg-[var(--gold)] text-white"
                    : position === 2
                      ? "bg-[var(--silver)] text-white"
                      : position === 3
                        ? "bg-[var(--bronze)] text-white"
                        : "bg-muted text-muted-foreground",
                )}
              >
                {position}
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-semibold">
                  {row.entryName}
                  {row.memberName && (
                    <span
                      title={`In the app as ${row.memberName}`}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary"
                    >
                      <UserCheck className="size-3" />
                      Member
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">{row.playerName}</p>
              </div>

              {/* Movement is only meaningful against FPL's own season ranking. */}
              {sortBy === "total" && <RankMovement rank={row.rank} lastRank={row.lastRank} />}

              <div className="shrink-0 text-right">
                <p className="font-bold tabular-nums">{highlight}</p>
                <p className="text-[11px] text-muted-foreground tabular-nums">{secondary}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SortTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

function RankMovement({ rank, lastRank }: { rank: number; lastRank: number }) {
  // FPL reports last_rank 0 before the first ranked Game Week.
  if (!lastRank || rank === lastRank) {
    return <Minus className="size-3.5 shrink-0 text-muted-foreground" aria-label="No change" />;
  }
  const moved = lastRank - rank;
  const up = moved > 0;
  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-0.5 text-xs font-semibold",
        up ? "text-[var(--fpl-green)]" : "text-[var(--fpl-pink)]",
      )}
      aria-label={up ? `Up ${moved}` : `Down ${Math.abs(moved)}`}
    >
      {up ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {Math.abs(moved)}
    </span>
  );
}
