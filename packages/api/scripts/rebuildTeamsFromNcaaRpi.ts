import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// --- Type Definitions ---
interface StagedRpiData {
    rank: number;
    school_name: string;
    conference: string | null; // Allow null based on potential source data
    record: string | null;
}

// Define the structure for the new teams records
// IMPORTANT: Do NOT include 'id' here, let Supabase generate it
interface NewTeamData {
    name: string;
    conference: string | null;
    // Add other columns from your 'teams' table here with default values if needed
    // e.g., is_active: true,
}
// --- End Type Definitions ---

// --- Environment & Supabase Client Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Path relative to packages/api/scripts/
const envPath = resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const STAGING_TABLE = 'stg_ncaa_rpi';
const TARGET_TABLE = 'teams';
// --- End Setup ---

// --- Main Rebuild Function ---
async function rebuildTeams() {
    console.log(`\n🛑 WARNING: This script will DELETE ALL data from the '${TARGET_TABLE}' table \n   and rebuild it from '${STAGING_TABLE}'. \n   Existing team IDs and relationships WILL BE BROKEN.\n`);
    // Optional: Add a small delay or confirmation prompt here in a real scenario
    // await new Promise(resolve => setTimeout(resolve, 5000)); // 5-second delay

    console.log(`Fetching data from staging table: ${STAGING_TABLE}...`);
    let processedCount = 0;
    let errorCount = 0;

    try {
        // 1. Fetch data from staging table
        const { data: stagedData, error: fetchError } = await supabase
            .from(STAGING_TABLE)
            .select('rank, school_name, conference'); // Select needed fields
        
        if (fetchError) {
            throw new Error(`Failed to fetch from ${STAGING_TABLE}: ${fetchError.message}`);
        }

        if (!stagedData || stagedData.length === 0) {
            console.log(`No data found in staging table ${STAGING_TABLE}. Exiting.`);
            return;
        }
        console.log(`Fetched ${stagedData.length} records from staging table.`);

        // 2. DELETE existing data from the target table
        console.log(`Deleting all existing records from target table: ${TARGET_TABLE}...`);
        // Use a condition that matches all rows but avoids issues with empty tables or specific RLS
        // Using created_at > epoch is a common pattern, adjust if your table doesn't have it.
        const { error: deleteError } = await supabase
            .from(TARGET_TABLE)
            .delete()
            .gt('created_at', '1970-01-01T00:00:00Z'); // Adjust column/condition if needed
        
        if (deleteError) {
            // Log the error but continue, maybe some rows failed deletion?
            console.error(`Error deleting from ${TARGET_TABLE}: ${deleteError.message}`);
            // Decide if you want to stop: throw new Error(...) 
        }
         console.log(`Deletion step completed (check logs for errors).`);

        // 3. Prepare new records for insertion
        const newTeamsPayload: NewTeamData[] = stagedData.map(item => ({
            name: item.school_name, // Map school_name to name
            conference: item.conference,
            // Add other default fields for your 'teams' table here
            // is_active: true, 
        }));
        console.log(`Prepared ${newTeamsPayload.length} new team records for insertion.`);

        // 4. Insert new records
        console.log(`Inserting new records into ${TARGET_TABLE}...`);
        // Supabase automatically generates the UUID for the primary key 'id'
        const { error: insertError } = await supabase
            .from(TARGET_TABLE)
            .insert(newTeamsPayload);

        if (insertError) {
            throw new Error(`Failed to insert new records into ${TARGET_TABLE}: ${insertError.message}`);
        }

        processedCount = newTeamsPayload.length;
        console.log(`Successfully inserted ${processedCount} records into ${TARGET_TABLE}.`);

    } catch (err: any) {
        console.error(`Fatal error during rebuild process: ${err.message}`);
        errorCount++;
    } finally {
        console.log(`\n'${TARGET_TABLE}' Table Rebuild Complete.`);
        console.log(`  New Records Inserted: ${processedCount}`);
        console.log(`  Errors encountered:   ${errorCount}`);
        if (errorCount === 0 && processedCount > 0) {
             console.log(`\n✅ Rebuild successful. REMEMBER TO UPDATE/RECONCILE RELATED TABLES (\`rankings\`, \`team_logos\`, etc.)!`);
        } else {
             console.log(`\n❌ Rebuild finished with errors or no records processed. Check logs.`);
        }
    }
}

// --- Run the script ---
rebuildTeams(); 