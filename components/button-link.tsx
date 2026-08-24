import Link from "next/link";
import { Button } from "@/components/ui/button";

type ButtonProps = React.ComponentProps<typeof Button>;

/**
 * A Button that navigates. Base UI's Button warns (and loses native button
 * semantics) when `render` swaps in a non-<button> element, so it needs
 * `nativeButton={false}` — encapsulated here so every call site gets it.
 */
export function ButtonLink({
  href,
  children,
  ...props
}: { href: string; children: React.ReactNode } & Omit<ButtonProps, "render" | "nativeButton">) {
  return <Button nativeButton={false} render={<Link href={href}>{children}</Link>} {...props} />;
}
