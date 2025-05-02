import { date, integer, numeric, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { teams } from './teams';

export const team_stats = pgTable('team_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  team_id: uuid('team_id').references(() => teams.id).notNull(),
  season_year: integer('season_year').notNull(),
  game_date: date('game_date').notNull(),
  stat_type: text('stat_type').notNull(),
  value: numeric('value').notNull(),
  source: text('source')
}); 