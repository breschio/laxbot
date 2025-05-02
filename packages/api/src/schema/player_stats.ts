import { date, integer, numeric, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { players } from './players';
import { teams } from './teams';

export const player_stats = pgTable('player_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  player_id: uuid('player_id').references(() => players.id).notNull(),
  team_id: uuid('team_id').references(() => teams.id).notNull(),
  season_year: integer('season_year').notNull(),
  game_date: date('game_date').notNull(),
  stat_type: text('stat_type').notNull(),
  value: numeric('value').notNull(),
  source: text('source')
}); 