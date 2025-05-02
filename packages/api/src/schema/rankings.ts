import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { teams } from './teams';

export const rankings = pgTable('rankings', {
  id: uuid('id').primaryKey().defaultRandom(),
  team_id: uuid('team_id').references(() => teams.id).notNull(),
  poll_name: text('poll_name').notNull(),
  rank: integer('rank').notNull(),
  week: integer('week').notNull(),
  year: integer('year').notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}); 