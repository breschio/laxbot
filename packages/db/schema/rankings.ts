import { pgTable, uuid, int4, text, timestamp, date } from 'drizzle-orm/pg-core';

export const rankings = pgTable('rankings', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').notNull(),
  rank: int4('rank').notNull(),
  poll: text('poll').notNull(),
  week: int4('week'),
  season: int4('season'),
  rankingDate: date('ranking_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}); 