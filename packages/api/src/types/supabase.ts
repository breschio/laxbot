import * as schemaExports from '../schema'; // Import all exports from schema index

export type Tables = {
  conferences: typeof schemaExports.conferences;
  teams: typeof schemaExports.teams;
  players: typeof schemaExports.players;
  rankings: typeof schemaExports.rankings;
  records: typeof schemaExports.records;
  team_stats: typeof schemaExports.team_stats;
  player_stats: typeof schemaExports.player_stats;
  team_rosters: typeof schemaExports.team_rosters;
  // Add stg_scoreboard if needed
  stg_scoreboard: typeof schemaExports.stgScoreboard;
};

export type Database = {
  public: {
    Tables: {
      conferences: {
        Row: typeof schemaExports.conferences.$inferSelect;
        Insert: typeof schemaExports.conferences.$inferInsert;
        Update: Partial<typeof schemaExports.conferences.$inferInsert>;
      };
      teams: {
        Row: typeof schemaExports.teams.$inferSelect;
        Insert: typeof schemaExports.teams.$inferInsert;
        Update: Partial<typeof schemaExports.teams.$inferInsert>;
      };
      players: {
        Row: typeof schemaExports.players.$inferSelect;
        Insert: typeof schemaExports.players.$inferInsert;
        Update: Partial<typeof schemaExports.players.$inferInsert>;
      };
      rankings: {
        Row: typeof schemaExports.rankings.$inferSelect;
        Insert: typeof schemaExports.rankings.$inferInsert;
        Update: Partial<typeof schemaExports.rankings.$inferInsert>;
      };
      records: {
        Row: typeof schemaExports.records.$inferSelect;
        Insert: typeof schemaExports.records.$inferInsert;
        Update: Partial<typeof schemaExports.records.$inferInsert>;
      };
      team_stats: {
        Row: typeof schemaExports.team_stats.$inferSelect;
        Insert: typeof schemaExports.team_stats.$inferInsert;
        Update: Partial<typeof schemaExports.team_stats.$inferInsert>;
      };
      player_stats: {
        Row: typeof schemaExports.player_stats.$inferSelect;
        Insert: typeof schemaExports.player_stats.$inferInsert;
        Update: Partial<typeof schemaExports.player_stats.$inferInsert>;
      };
      team_rosters: {
        Row: typeof schemaExports.team_rosters.$inferSelect;
        Insert: typeof schemaExports.team_rosters.$inferInsert;
        Update: Partial<typeof schemaExports.team_rosters.$inferInsert>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}; 