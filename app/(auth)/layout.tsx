import { BrandMark } from "@/components/brand-mark";
import { APP_NAME } from "@/lib/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-fpl-hero relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Drifting colour blobs + a faint grid give the deep-purple hero some
          depth and motion instead of a flat panel. All decorative, so aria-
          hidden and behind the content (-z / pointer-events-none). */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-float absolute -top-24 -left-24 size-80 rounded-full bg-[var(--fpl-green)]/25 blur-3xl" />
        <div
          className="animate-float absolute top-1/3 -right-24 size-96 rounded-full bg-[var(--fpl-pink)]/30 blur-3xl"
          style={{ animationDelay: "-4s", animationDuration: "18s" }}
        />
        <div
          className="animate-float absolute -bottom-28 left-1/4 size-80 rounded-full bg-[var(--fpl-cyan)]/20 blur-3xl"
          style={{ animationDelay: "-8s", animationDuration: "16s" }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4 text-center text-white">
          <div className="rounded-3xl bg-white/10 p-3 ring-1 ring-white/20 backdrop-blur-sm">
            <BrandMark />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black leading-tight tracking-tight text-balance">{APP_NAME}</h1>
            <p className="text-sm text-white/70">Private competition · real money on the line</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <Pill>🏆 Weekly prizes</Pill>
            <Pill>📊 Live standings</Pill>
            <Pill>🤝 Fair &amp; transparent</Pill>
          </div>
        </div>
        {children}
        <p className="mt-6 text-center text-xs text-white/50">Invite-only · for the crew only ⚽</p>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 ring-1 ring-white/15 backdrop-blur-sm">
      {children}
    </span>
  );
}
