import { integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { teams } from './teams';

export const records = pgTable('records', {
  id: uuid('id').primaryKey().defaultRandom(),
  team_id: uuid('team_id').references(() => teams.id).notNull(),
  season_year: integer('season_year').notNull(),
  overall_wins: integer('overall_wins').notNull(),
  overall_losses: integer('overall_losses').notNull(),
  conference_wins: integer('conference_wins').notNull(),
  conference_losses: integer('conference_losses').notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}); 