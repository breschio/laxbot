import { pgTable, uuid, int4, timestamp } from 'drizzle-orm/pg-core';

export const teamRosters = pgTable('team_rosters', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').notNull(),
  playerId: uuid('player_id').notNull(),
  season: int4('season').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}); 