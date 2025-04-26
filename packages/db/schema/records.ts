import { pgTable, uuid, int4, text, timestamp } from 'drizzle-orm/pg-core';

export const records = pgTable('records', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').notNull(),
  season: int4('season').notNull(),
  wins: int4('wins').notNull(),
  losses: int4('losses').notNull(),
  ties: int4('ties'),
  type: text('type'), // e.g., 'overall', 'conference'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}); 