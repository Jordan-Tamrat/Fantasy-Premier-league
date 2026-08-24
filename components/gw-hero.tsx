import { GameWeekStatusBadge } from "@/components/gameweek-status-badge";

export function GameWeekHero({
  fplEventId,
  status,
  subtitle,
  children,
}: {
  fplEventId: number;
  status: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-fpl-hero relative z-0 overflow-hidden px-4 pt-6 pb-10 text-white md:rounded-b-3xl md:px-8">
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-widest text-white/60 uppercase">Game Week</p>
          <p className="text-4xl font-black tracking-tight">{fplEventId}</p>
          {subtitle && <p className="mt-1 text-sm text-white/70">{subtitle}</p>}
        </div>
        <GameWeekStatusBadge status={status} />
      </div>
      {children && <div className="relative mt-4">{children}</div>}
    </div>
  );
}
