import { Router, Request, Response } from 'express';
import { db } from '@db';
import * as schema from '@schema';
import { sql, eq, asc, desc } from 'drizzle-orm';

// Re-using the same structure, renaming interface might be overkill here
interface StandingsEntry {
  rank: number | null;
  team_id?: string; 
  team_name: string | null;
  record1: string | null; 
  record2: string | null; 
}

// Renaming Query interface for clarity
interface RankingsQuery { 
  filter?: string;
}

// Keeping constants the same as logic is identical
const STANDINGS_TABLE_PREFIX = 'stg_conf_';
const VALID_CONFERENCES = [
  'acc', 'big_ten', 'ivy_league', 'big_east', 'patriot', 
  'caa', 'asun', 'america_east', 'nec', 'atlantic_10'
];

const router = Router();

// Refactor route handler for Express
router.get(
  '/rankings', 
  async (req: Request<{}, {}, {}, RankingsQuery>, res: Response) => {
    const filter = req.query.filter || 'top-20'; 
    let data: StandingsEntry[] = [];
    let errorMsg: string | null = null;

    try {
      if (filter === 'top-20') {
        const result = await db
          .select({
            rank: schema.rankings.rank,
            team_name: schema.rankings.team_id,
            record1: schema.rankings.year,
            team_id: schema.rankings.team_id
          })
          .from(schema.rankings)
          .orderBy(asc(schema.rankings.rank))
          .limit(20);
        
        data = result.map(row => ({ 
          ...row,
          record1: String(row.record1),
          team_name: String(row.team_id),
          record2: null 
        }));

      } else if (filter === 'all') {
          const result = await db
          .select({
            rank: schema.rankings.rank,
            team_name: schema.rankings.team_id,
            record1: schema.rankings.year,
            team_id: schema.rankings.team_id
          })
          .from(schema.rankings)
          .orderBy(asc(schema.rankings.rank));

         data = result.map(row => ({ 
          ...row,
          record1: String(row.record1),
          team_name: String(row.team_id),
          record2: null 
        }));

      } else if (VALID_CONFERENCES.includes(filter)) {
        const tableName = `${STANDINGS_TABLE_PREFIX}${filter}`;
         const rawQuery = sql`SELECT conference_rank, team_name, conference_record, overall_record FROM ${sql.raw(tableName)} ORDER BY conference_rank ASC`;
         
         type ConfStandingRaw = {
           conference_rank: number;
           team_name: string;
           conference_record: string | null;
           overall_record: string | null;
         };
         
         const queryResult = await db.execute<ConfStandingRaw>(rawQuery); 
         const result: ConfStandingRaw[] = (queryResult as any).rows || queryResult;
         
         data = result.map(row => ({
           rank: row.conference_rank,
           team_name: row.team_name,
           record1: row.conference_record,
           record2: row.overall_record,
         }));

      } else {
        errorMsg = 'Invalid filter specified.';
      }
    } catch (err: any) {
       console.error(`Error fetching rankings for filter '${filter}':`, err); 
       errorMsg = `Failed to fetch rankings: ${err.message}`; 
       data = []; 
    }

    if (errorMsg) {
      res.status(400).json({ error: errorMsg, data: [] });
    } else {
      res.json({ data });
    }
  }
);

export default router; 