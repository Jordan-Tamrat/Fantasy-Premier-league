import Image from "next/image";
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

/** The signed-URL route path for a user's avatar, or null if they haven't set one. */
export function avatarUrl(user: { id: string; profileImagePath: string | null }): string | null {
  return user.profileImagePath ? `/api/attachments/avatar/${user.id}` : null;
}

export function Avatar({
  name,
  imageUrl,
  size = "md",
}: {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md";
}) {
  const dimension = size === "sm" ? 24 : 32;
  const sizeClass = size === "sm" ? "size-6" : "size-8";

  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name}
        width={dimension}
        height={dimension}
        unoptimized
        className={cn(sizeClass, "shrink-0 rounded-full object-cover")}
      />
    );
  }

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className={cn(
        sizeClass,
        "flex shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground",
      )}
    >
      {initials}
    </span>
  );
}
