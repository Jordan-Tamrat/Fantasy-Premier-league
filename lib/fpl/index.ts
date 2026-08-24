import { fplFetch, FPLApiError } from "./client";
import type {
  FPLBootstrapData,
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

export const FPLService = {
  getBootstrapData,
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
