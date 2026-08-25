// The league is Ethiopia-based, so every date/time shown to users is rendered
// in Addis Ababa time (EAT, UTC+3, no daylight saving) regardless of the
// server's timezone — on Vercel the server runs in UTC, which is why dates
// looked "off" before. Storage is always UTC in the database; this only
// affects display.
const LEAGUE_TIME_ZONE = "Africa/Addis_Ababa";

/** e.g. "25 Aug 2026, 8:30 PM" */
export function formatDateTime(value: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: LEAGUE_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

/** e.g. "25 Aug 2026" */
export function formatDate(value: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: LEAGUE_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

/** e.g. "8:30 PM" */
export function formatTime(value: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: LEAGUE_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

/**
 * A stable day key in league time (YYYY-MM-DD), for grouping chat messages
 * under date separators. Using the formatted parts avoids UTC-vs-local
 * boundary bugs at midnight.
 */
export function leagueDayKey(value: Date | string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LEAGUE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
  return parts; // en-CA yields YYYY-MM-DD
}

/** Telegram-style day label: "Today", "Yesterday", or "25 August 2026". */
export function formatDaySeparator(value: Date | string): string {
  const key = leagueDayKey(value);
  const todayKey = leagueDayKey(new Date());
  const yesterdayKey = leagueDayKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
  if (key === todayKey) return "Today";
  if (key === yesterdayKey) return "Yesterday";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: LEAGUE_TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}
