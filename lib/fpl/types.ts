// Shapes are the subset of https://fantasy.premierleague.com/api/ fields this
// app actually reads, verified against the live API. Unused fields are
// omitted rather than guessed.

export interface FPLEvent {
  id: number;
  name: string;
  deadline_time: string;
  finished: boolean;
  data_checked: boolean;
  is_previous: boolean;
  is_current: boolean;
  is_next: boolean;
}

export interface FPLBootstrapData {
  events: FPLEvent[];
  teams: unknown[];
  elements: unknown[];
  element_types: unknown[];
}

export interface FPLManagerEntry {
  id: number;
  player_first_name: string;
  player_last_name: string;
  name: string; // team name
  summary_overall_points: number;
  summary_event_points: number;
  current_event: number | null;
}

export interface FPLManagerHistoryEntry {
  event: number;
  points: number;
  total_points: number;
  rank: number | null;
  event_transfers: number;
  event_transfers_cost: number;
  points_on_bench: number;
}

export interface FPLManagerHistory {
  current: FPLManagerHistoryEntry[];
  past: unknown[];
  chips: unknown[];
}

export interface FPLPick {
  element: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
}

export interface FPLManagerEventPicks {
  active_chip: string | null;
  entry_history: {
    event: number;
    points: number;
    total_points: number;
    rank: number | null;
    points_on_bench: number;
    event_transfers: number;
    event_transfers_cost: number;
  };
  picks: FPLPick[];
}

export interface FPLLiveElementStats {
  total_points: number;
  minutes: number;
}

export interface FPLLiveEvent {
  elements: { id: number; stats: FPLLiveElementStats }[];
}

export interface FPLFixture {
  id: number;
  event: number | null;
  kickoff_time: string | null;
  finished: boolean;
  team_h: number;
  team_a: number;
  team_h_score: number | null;
  team_a_score: number | null;
}

export interface FPLTransfer {
  element_in: number;
  element_out: number;
  event: number;
  time: string;
}
