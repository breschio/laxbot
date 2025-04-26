import { pgTable, uuid, int4, numeric, timestamp } from 'drizzle-orm/pg-core';

export const teamStats = pgTable('team_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').notNull(),
  gameId: uuid('game_id'),
  season: int4('season'),
  goals: int4('goals'),
  assists: int4('assists'),
  shots: int4('shots'),
  groundBalls: int4('ground_balls'),
  turnovers: int4('turnovers'),
  saves: int4('saves'),
  faceoffWins: int4('faceoff_wins'),
  faceoffAttempts: int4('faceoff_attempts'),
  clears: int4('clears'),
  penalties: int4('penalties'),
  minutes: numeric('minutes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}); 