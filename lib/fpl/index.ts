import { fplFetch, FPLApiError } from "./client";
import type {
  FPLBootstrapData,
  FPLClassicLeague,
  FPLEvent,
  FPLFixture,
  FPLLiveEvent,
  FPLManagerEntry,
  FPLManagerEventPicks,
  FPLManagerHistory,
  FPLTransfer,
} from "./types";

export { FPLApiError };
export type * from "./types";

// bootstrap-static/ is a large payload that rarely changes outside deadline
// moments, so it's worth a short in-memory cache. Everything else is fetched
// fresh — no Redis needed at this scale (see build plan).
let bootstrapCache: { data: FPLBootstrapData; fetchedAt: number } | null = null;
const BOOTSTRAP_CACHE_TTL_MS = 60_000;

async function getBootstrapData(options?: { force?: boolean }): Promise<FPLBootstrapData> {
  const isFresh = bootstrapCache && Date.now() - bootstrapCache.fetchedAt < BOOTSTRAP_CACHE_TTL_MS;
  if (!options?.force && isFresh) {
    return bootstrapCache!.data;
  }
  const data = await fplFetch<FPLBootstrapData>("/bootstrap-static/");
  bootstrapCache = { data, fetchedAt: Date.now() };
  return data;
}

async function getCurrentEvent(): Promise<FPLEvent | null> {
  const { events } = await getBootstrapData();
  return events.find((event) => event.is_current) ?? null;
}

async function getNextEvent(): Promise<FPLEvent | null> {
  const { events } = await getBootstrapData();
  return events.find((event) => event.is_next) ?? null;
}

async function getEventById(eventId: number): Promise<FPLEvent | null> {
  const { events } = await getBootstrapData();
  return events.find((event) => event.id === eventId) ?? null;
}

async function getFixtures(eventId?: number): Promise<FPLFixture[]> {
  return fplFetch<FPLFixture[]>(eventId ? `/fixtures/?event=${eventId}` : "/fixtures/");
}

async function getGameWeekLiveData(eventId: number): Promise<FPLLiveEvent> {
  return fplFetch<FPLLiveEvent>(`/event/${eventId}/live/`);
}

async function getManager(entryId: number): Promise<FPLManagerEntry> {
  return fplFetch<FPLManagerEntry>(`/entry/${entryId}/`);
}

async function getManagerHistory(entryId: number): Promise<FPLManagerHistory> {
  return fplFetch<FPLManagerHistory>(`/entry/${entryId}/history/`);
}

async function getManagerGameWeekPicks(entryId: number, eventId: number): Promise<FPLManagerEventPicks> {
  return fplFetch<FPLManagerEventPicks>(`/entry/${entryId}/event/${eventId}/picks/`);
}

async function getManagerTransfers(entryId: number): Promise<FPLTransfer[]> {
  return fplFetch<FPLTransfer[]>(`/entry/${entryId}/transfers/`);
}

// The number that feeds the prize engine: this manager's score for exactly
// this Game Week, never their season total.
async function getManagerGameWeekPoints(entryId: number, eventId: number): Promise<number> {
  const picks = await getManagerGameWeekPicks(entryId, eventId);
  return picks.entry_history.points;
}

/**
 * Standings for a classic league. FPL paginates at 50 entries per page, so
 * this walks pages until `has_next` is false — a ~25-person league is one
 * request, but this stays correct if the league grows.
 */
// FPL takes the game offline while a new Game Week rolls over (the leagues
// endpoint 503s even though bootstrap-static keeps serving), so standings are
// cached briefly and the last good response is kept as a fallback — during
// that window members see slightly stale standings instead of an error.
const LEAGUE_CACHE_TTL_MS = 120_000;
const leagueCache = new Map<number, { data: FPLClassicLeague; fetchedAt: number }>();

async function getClassicLeagueStandings(leagueId: number): Promise<FPLClassicLeague> {
  const cached = leagueCache.get(leagueId);
  if (cached && Date.now() - cached.fetchedAt < LEAGUE_CACHE_TTL_MS) return cached.data;

  try {
    const fresh = await fetchClassicLeagueStandings(leagueId);
    leagueCache.set(leagueId, { data: fresh, fetchedAt: Date.now() });
    return fresh;
  } catch (error) {
    // Serving slightly stale standings beats showing an error page when FPL
    // is throttling us.
    if (cached) return cached.data;
    throw error;
  }
}

async function fetchClassicLeagueStandings(leagueId: number): Promise<FPLClassicLeague> {
  const first = await fplFetch<FPLClassicLeague>(`/leagues-classic/${leagueId}/standings/`);
  if (!first.standings.has_next) return first;

  const results = [...first.standings.results];
  let page = first.standings.page;
  let hasNext: boolean = first.standings.has_next;
  // Bounded so a malformed response can never loop forever.
  while (hasNext && page < 20) {
    page += 1;
    const next = await fplFetch<FPLClassicLeague>(
      `/leagues-classic/${leagueId}/standings/?page_standings=${page}`,
    );
    results.push(...next.standings.results);
    hasNext = next.standings.has_next;
  }
  return { league: first.league, standings: { has_next: hasNext, page, results } };
}

export const FPLService = {
  getBootstrapData,
  getClassicLeagueStandings,
  getCurrentEvent,
  getNextEvent,
  getEventById,
  getFixtures,
  getGameWeekLiveData,
  getManager,
  getManagerHistory,
  getManagerGameWeekPicks,
  getManagerTransfers,
  getManagerGameWeekPoints,
};
