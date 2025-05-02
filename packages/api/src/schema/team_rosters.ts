import { boolean, integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { players } from './players';
import { teams } from './teams';

export const team_rosters = pgTable('team_rosters', {
  id: uuid('id').primaryKey().defaultRandom(),
  player_id: uuid('player_id').references(() => players.id).notNull(),
  team_id: uuid('team_id').references(() => teams.id).notNull(),
  season_year: integer('season_year').notNull(),
  jersey_number: integer('jersey_number'),
  is_captain: boolean('is_captain').default(false),
  created_at: timestamp('created_at').defaultNow().notNull()
}); 