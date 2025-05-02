// ESPN Scoreboard API Types

export interface ESPNScoreboard {
  events: ESPNEvent[];
}

export interface ESPNEvent {
  id: string;
  name: string;
  competitions: ESPNCompetition[];
}

export interface ESPNCompetition {
  id: string;
  competitors: ESPNTeam[];
}

export interface ESPNTeam {
  team: {
    id: string;
    abbreviation: string;
    displayName: string;
    record?: {
      items: {
        type: string;
        summary: string;
      }[];
    };
  };
  score?: string;
} 