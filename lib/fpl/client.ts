// The only file in the app allowed to know the FPL API's base URL and paths.
// Everything else goes through lib/fpl/index.ts's FPLService.

const FPL_API_BASE_URL = process.env.FPL_API_BASE_URL ?? "https://fantasy.premierleague.com/api";

export class FPLApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "FPLApiError";
  }
}

export async function fplFetch<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${FPL_API_BASE_URL}${path}`, {
      headers: { Accept: "application/json" },
      // Live Game Week data can change every few seconds; never let Next.js's
      // fetch cache serve a stale response here.
      cache: "no-store",
    });
  } catch {
    throw new FPLApiError(`FPL API request failed: ${path} (network error)`);
  }
  if (!response.ok) {
    throw new FPLApiError(`FPL API request failed: ${path} (${response.status})`, response.status);
  }
  return response.json() as Promise<T>;
}
