import { pgTable, uuid, int4, numeric, timestamp } from 'drizzle-orm/pg-core';

export const playerStats = pgTable('player_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: uuid('player_id').notNull(),
  gameId: uuid('game_id'),
  season: int4('season'),
  goals: int4('goals'),
  assists: int4('assists'),
  points: int4('points'),
  shots: int4('shots'),
  groundBalls: int4('ground_balls'),
  causedTurnovers: int4('caused_turnovers'),
  saves: int4('saves'),
  faceoffWins: int4('faceoff_wins'),
  faceoffAttempts: int4('faceoff_attempts'),
  minutes: numeric('minutes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}); 