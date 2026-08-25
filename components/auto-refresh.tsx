"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Keeps a server-rendered page fresh without the user pressing refresh.
 * Calls router.refresh() (which re-runs the page's server components and
 * swaps in new data while preserving client state) on a modest interval and
 * whenever the tab regains focus — so a member sees a newly-created Game Week,
 * an admin sees a just-submitted payment, etc.
 *
 * This is deliberately polling, not websockets: for a private league of ~20
 * it's plenty, matches the chat's existing approach, and needs no extra
 * infrastructure. The tab-focus refresh covers the common "I switched over to
 * check" case instantly; the interval handles a tab left open in the
 * foreground.
 */
export function AutoRefresh({ intervalMs = 20000 }: { intervalMs?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  // Chat runs its own tighter polling loop, so a route-level refresh there is
  // pure waste — skip it and let the chat client keep itself current.
  const enabled = !pathname.startsWith("/chat");

  useEffect(() => {
    if (!enabled) return;
    const refresh = () => {
      if (!document.hidden) router.refresh();
    };

    const interval = setInterval(refresh, intervalMs);
    const onVisible = () => {
      if (!document.hidden) router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
    };
  }, [router, intervalMs, enabled]);

  return null;
}
