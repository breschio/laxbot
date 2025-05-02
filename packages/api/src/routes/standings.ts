import { Router, Request, Response } from 'express'; // Import Express types
import { db } from '@db';
import * as schema from '@schema';
import { sql, eq, asc, desc } from 'drizzle-orm';

// Define a common structure for the response data
interface StandingsEntry {
  rank: number | null;
  team_id?: string; // Optional, might be useful later
  team_name: string | null;
  record1: string | null; // Primary record (e.g., Overall for RPI, Conf for Conf Standings)
  record2: string | null; // Secondary record (e.g., null for RPI, Overall for Conf Standings)
  // Add other potential fields like streak if needed later
}

interface StandingsQuery {
  filter?: string;
}

const STANDINGS_TABLE_PREFIX = 'stg_conf_';
const VALID_CONFERENCES = [
  'acc', 'big_ten', 'ivy_league', 'big_east', 'patriot', 
  'caa', 'asun', 'america_east', 'nec', 'atlantic_10'
];

const router = Router(); // Create Express router

// Refactor route handler for Express
router.get(
  '/standings',
  async (req: Request<{}, {}, {}, StandingsQuery>, res: Response) => { // Use Express Request/Response
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
        
        // TODO: Need to join with teams table to get team_name
        // TODO: Need appropriate field for record1 (record)
        data = result.map(row => ({ 
          ...row,
          record1: String(row.record1), // Cast year to string
          team_name: String(row.team_id),
          record2: null 
        })); // Temporary mapping

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

         // TODO: Need to join with teams table to get team_name
         // TODO: Need appropriate field for record1 (record)
         data = result.map(row => ({ 
          ...row,
          record1: String(row.record1), // Cast year to string
          team_name: String(row.team_id),
          record2: null 
        })); // Temporary mapping

      } else if (VALID_CONFERENCES.includes(filter)) {
        const tableName = `${STANDINGS_TABLE_PREFIX}${filter}`;
        // Dynamically query the conference table - assumes tables exist and have expected columns
        // IMPORTANT: Direct table name injection is generally unsafe without validation.
        // Here, we rely on VALID_CONFERENCES check for safety.
        // Drizzle doesn't directly support dynamic table names easily, might need raw SQL or helper function
        // For now, let's assume a way to reference these tables (this part might need refinement based on Drizzle/DB setup)
        
        // Example using raw SQL (adjust based on actual db setup)
        // Note: This is illustrative and might need specific Drizzle syntax or helper
         const rawQuery = sql`SELECT conference_rank, team_name, conference_record, overall_record FROM ${sql.raw(tableName)} ORDER BY conference_rank ASC`;
         
         // TODO: Execute the dynamic query using db instance. Drizzle's `db.execute()` or similar might be needed.
         // This requires knowing the exact return type structure. Let's define a placeholder type.
         type ConfStandingRaw = {
           conference_rank: number;
           team_name: string;
           conference_record: string | null;
           overall_record: string | null;
         };
         
         // Placeholder execution - replace with actual Drizzle execution method
         // Using db.execute for raw query; ensure your DB driver supports this correctly.
         // The result type depends on the driver (e.g., `QueryResult` for node-postgres).
         // We cast it to our expected type for mapping.
         const queryResult = await db.execute<ConfStandingRaw>(rawQuery); 

         // Access rows based on your driver (e.g., result.rows for node-postgres)
         // Adjust this based on the actual structure returned by your db.execute()
         const result: ConfStandingRaw[] = (queryResult as any).rows || queryResult; // Basic fallback
         
         // Map to common structure
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
       console.error(`Error fetching standings for filter '${filter}':`, err);
       errorMsg = `Failed to fetch standings: ${err.message}`;
       data = []; 
    }

    if (errorMsg) {
      res.status(400).json({ error: errorMsg, data: [] }); // Use res.status().json()
    } else {
      res.json({ data }); // Use res.json()
    }
  }
);

export default router; // Export the router instance 