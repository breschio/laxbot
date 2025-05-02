import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// --- Type Definitions ---
interface StagedRpiData {
    conference: string | null;
}

interface NewConferenceData {
    name: string;
}
// --- End Type Definitions ---

// --- Environment & Supabase Client Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../../.env'); // Relative to packages/api/scripts/
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const STAGING_TABLE = 'stg_ncaa_rpi';
const TARGET_TABLE = 'conferences';
// --- End Setup ---

// --- Main Population Function ---
async function populateConferences() {
    console.log(`Starting conference population from ${STAGING_TABLE} to ${TARGET_TABLE}...`);
    let processedCount = 0;
    let errorCount = 0;

    try {
        // 1. Fetch distinct, non-null conference names from staging table
        console.log(`Fetching distinct conferences from ${STAGING_TABLE}...`);
        const { data: distinctData, error: fetchError } = await supabase
            .from(STAGING_TABLE)
            .select('conference')
            // Filter out nulls explicitly and select unique names
            .neq('conference', '') // Handle empty strings if necessary
            .not('conference', 'is', null); 
            // Note: Supabase select doesn't directly support DISTINCT on a single column easily.
            // We'll handle uniqueness client-side or rely on the upsert.

        if (fetchError) {
            throw new Error(`Failed to fetch from ${STAGING_TABLE}: ${fetchError.message}`);
        }

        if (!distinctData || distinctData.length === 0) {
            console.log(`No non-null conference data found in ${STAGING_TABLE}. Exiting.`);
            return;
        }
        
        // Create a unique set of conference names client-side
        const uniqueConferenceNames = new Set(
            distinctData
                .map(item => item.conference)
                .filter((name): name is string => name !== null && name.trim() !== '') // Ensure string and not empty
        );

        if (uniqueConferenceNames.size === 0) {
            console.log('No valid unique conference names found after filtering. Exiting.');
            return;
        }

        console.log(`Found ${uniqueConferenceNames.size} unique conference names to process.`);

        // 2. Prepare payload for insertion
        const conferencesPayload: NewConferenceData[] = Array.from(uniqueConferenceNames).map(name => ({ name }));

        // 3. Upsert into target table
        // Use onConflict: 'name' to avoid errors if a conference already exists
        // and ensure we only insert unique names.
        console.log(`Upserting ${conferencesPayload.length} unique conferences into ${TARGET_TABLE}...`);
        const { error: upsertError } = await supabase
            .from(TARGET_TABLE)
            .upsert(conferencesPayload, { 
                onConflict: 'name', // Requires 'name' to have a UNIQUE constraint
                ignoreDuplicates: true // Use ignoreDuplicates instead of trying to update
             }); 

        if (upsertError) {
            throw new Error(`Failed to upsert conferences into ${TARGET_TABLE}: ${upsertError.message}`);
        }

        processedCount = conferencesPayload.length;
        console.log(`Successfully upserted/ignored ${processedCount} conference records.`);

    } catch (err: any) {
        console.error(`Fatal error during conference population: ${err.message}`);
        errorCount++;
    } finally {
        console.log(`\n'${TARGET_TABLE}' Table Population Complete.`);
        console.log(`  Unique Conferences Processed: ${processedCount}`);
        console.log(`  Errors encountered:           ${errorCount}`);
    }
}

// --- Run the script ---
populateConferences(); 