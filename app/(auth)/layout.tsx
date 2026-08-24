import { BrandMark } from "@/components/brand-mark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-fpl-hero flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center text-white">
          <BrandMark />
          <div>
            <p className="text-xl font-bold tracking-tight">Fantasy Money League</p>
            <p className="text-sm text-white/60">Private competition, real money on the line</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
