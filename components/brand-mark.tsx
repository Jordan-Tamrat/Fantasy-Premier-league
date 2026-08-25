import Image from "next/image";
import { cn } from "@/lib/utils";
import brandLogo from "@/app/icon.png";

export function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  const dimension = size === "sm" ? 28 : 36;
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_0_16px_-4px_var(--fpl-green)]",
        size === "sm" ? "size-7" : "size-9",
      )}
    >
      <Image src={brandLogo} alt="" width={dimension} height={dimension} className="size-full object-contain p-0.5" />
    </span>
  );
}
