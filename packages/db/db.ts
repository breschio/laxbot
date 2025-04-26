import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

import { teams } from './schema/teams';
import { players } from './schema/players';
import { conferences } from './schema/conferences';
import { rankings } from './schema/rankings';
import { records } from './schema/records';
import { playerStats } from './schema/player_stats';
import { teamStats } from './schema/team_stats';
import { teamRosters } from './schema/team_rosters';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

export {
  teams,
  players,
  conferences,
  rankings,
  records,
  playerStats,
  teamStats,
  teamRosters,
}; 