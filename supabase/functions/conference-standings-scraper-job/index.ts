import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";
// Note: Puppeteer is not available in Supabase Edge Functions.
// Need to rely on fetch + Cheerio or find alternatives if JS rendering is essential.

// --- Type Definitions (Copied from original script) ---
interface ConferenceStandingData {
    team_name: string;
    conference_rank: number;
    conference_record?: string | null;
    conference_pct?: number | null;
    overall_record?: string | null;
    overall_pct?: number | null;
    streak?: string | null;
    raw_columns?: string[];
    scraped_at: string; // Added for upsert payload
}
// --- End Type Definitions ---

// --- Supabase Client Setup (using environment variables) ---
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);
// --- End Setup ---

// --- Conference Scraping Function (Adapted for Deno, No Puppeteer) ---
async function scrapeConferenceStandings(url: string, conferenceIdentifier: string): Promise<ConferenceStandingData[]> {
    console.log(` -> Scraping: ${conferenceIdentifier} from ${url}`);
    const scrapedData: ConferenceStandingData[] = [];
    let html = '';

    try {
        // Fetch HTML using Deno's fetch
        console.log(`    -> Fetching HTML for ${conferenceIdentifier}...`);
        const response = await fetch(url, {
            headers: { 'User-Agent': 'LaxBot/ConferenceScraper-Deno/1.0' }
        });

        if (!response.ok) {
             console.warn(`    -> HTTP error ${response.status} for ${conferenceIdentifier}. Skipping.`);
             // Special handling for Big Ten / NEC might be needed if fetch fails due to JS requirement
             if (conferenceIdentifier === 'big_ten' || conferenceIdentifier === 'nec') {
                 console.error(`    -> Fetch failed for ${conferenceIdentifier}. This conference might require browser rendering (Puppeteer) which is not available in Edge Functions.`);
             }
            return []; // Skip this conference on fetch error
        }
        html = await response.text();
        console.log(`    -> Fetch successful for ${conferenceIdentifier}.`);

        if (!html) {
            console.warn(`    -> No HTML content fetched for ${conferenceIdentifier}. Skipping.`);
            return [];
        }

        const $ = cheerio.load(html);
        let table = $();

        // --- Find Table Logic (Simplified - Check if default selectors work) ---
        // NOTE: Big Ten and NEC specific logic that relied on Puppeteer's rendered HTML is removed.
        // We'll rely on basic selectors. If these fail, these conferences cannot be scraped via this Edge Function.
        if (conferenceIdentifier === 'big_ten') {
             console.warn(`    -> Big Ten scraping might be unreliable without browser rendering.`);
        }
         if (conferenceIdentifier === 'nec') {
             console.warn(`    -> NEC scraping might be unreliable without browser rendering.`);
         }
        
        // Default Selector Logic
        table = $('table.sidearm-standings-table');
        if (table.length === 0) table = $('#standings-table');
        if (table.length === 0) table = $('table.table');
        if (table.length === 0) table = $('table').first(); // Less reliable fallback

        if (table.length === 0) {
            console.warn(`    -> No table found matching common selectors for ${conferenceIdentifier}. Skipping.`);
            return [];
        }
        // --- End Find Table Logic ---

        console.log(`    -> Table found for ${conferenceIdentifier}. Processing rows...`);
        const rows = table.find('tbody > tr');
        rows.each((index, element) => {
            const columns = $(element).find('td');
            const rawColumns: string[] = [];
            columns.each((_i, col) => {
                rawColumns.push($(col).text().trim());
            });

            if (rawColumns.length > 0) {
                let team_name: string = 'Unknown Team';
                let conference_record: string | null = null;
                let conference_pct_str: string | null = null;
                let overall_record: string | null = null;
                let overall_pct_str: string | null = null;
                let streak: string | null = null;
                let conference_rank = index + 1; // Simple rank based on row order

                 try {
                     // Simplified Parsing Logic (assuming common table structure)
                     // Indices might need adjustment per conference site if structure varies widely
                     team_name = rawColumns[1]?.trim() || rawColumns[0]?.trim() || 'Unknown Team';
                     conference_record = rawColumns[2]?.trim() || null;
                     conference_pct_str = rawColumns[3]?.trim() || null;
                     overall_record = rawColumns[4]?.trim() || null;
                     overall_pct_str = rawColumns[5]?.trim() || null;
                     streak = rawColumns[6]?.trim() || null;

                     // Clean up team name
                     team_name = team_name.replace(/\s*[*#^!xy]+$/, '').trim();

                     const parsePct = (pctStr: string | null): number | null => {
                         if (!pctStr) return null;
                         const num = parseFloat(pctStr);
                         return isNaN(num) ? null : num;
                     };

                     if (team_name && team_name !== 'Unknown Team') {
                         const standingEntry: Omit<ConferenceStandingData, 'scraped_at'> = { // Omit scraped_at here
                             team_name: team_name,
                             conference_rank: conference_rank,
                             conference_record: conference_record,
                             conference_pct: parsePct(conference_pct_str),
                             overall_record: overall_record,
                             overall_pct: parsePct(overall_pct_str),
                             streak: streak,
                             raw_columns: rawColumns
                         };
                         // Add scraped_at timestamp just before returning/pushing
                         scrapedData.push({
                             ...standingEntry,
                             scraped_at: new Date().toISOString()
                         });
                     } else {
                         console.warn(`    -> Skipping row ${index} for ${conferenceIdentifier}: Could not parse valid team name from [${rawColumns.join(', ')}]`);
                     }

                 } catch (parseError: any) {
                     console.error(`    -> Error parsing row ${index} for ${conferenceIdentifier}: ${parseError.message}`);
                     console.error(`    -> Raw column data for errored row:`, rawColumns);
                 }
            }
        });
        console.log(`    -> Extracted ${scrapedData.length} teams for ${conferenceIdentifier}.`);

    } catch (error: any) {
        console.error(` -> Failed overall scrape for ${conferenceIdentifier} from ${url}: ${error.message}`);
        return []; // Return empty on major error
    }
    return scrapedData;
}

// --- Main Runner Logic ---
async function runAllConferenceScrapers() {
    console.log('Starting conference scrapers (excluding Big Ten, NEC) via Edge Function...');
    
    // Conference URLs (Original list)
     const allConferences = [
         { name: 'ivy_league', url: 'https://ivyleague.com/standings.aspx?path=mlax' },
         { name: 'acc', url: 'https://theacc.com/standings.aspx?path=mlax' },
         { name: 'big_ten', url: 'https://bigten.org/standings.aspx?path=mlax' }, // Will be excluded
         { name: 'patriot', url: 'https://patriotleague.org/standings.aspx?path=mlax' },
         { name: 'big_east', url: 'https://www.bigeast.com/standings.aspx?path=mlax' },
         { name: 'caa', url: 'https://caasports.com/standings.aspx?path=mlax' },
         { name: 'asun', url: 'https://asunsports.org/standings.aspx?path=mlax' },
         { name: 'america_east', url: 'https://americaeast.com/standings.aspx?path=mlax' },
         { name: 'nec', url: 'https://www.insidelacrosse.com/league/DI/teams' }, // Will be excluded
         { name: 'atlantic_10', url: 'https://atlantic10.com/standings.aspx?path=MLAX' }
     ];

    // Filter out Big Ten and NEC for this Edge Function run
    const conferencesToRun = allConferences.filter(conf => conf.name !== 'big_ten' && conf.name !== 'nec');
    console.log(` -> Edge Function will process: ${conferencesToRun.map(c => c.name).join(', ')}`);

    let totalUpserted = 0;
    let totalErrors = 0;

    // Iterate over the filtered list
    for (const conf of conferencesToRun) { 
        const tableName = `stg_conf_${conf.name}`;
        const data = await scrapeConferenceStandings(conf.url, conf.name);

        if (data.length > 0) {
            console.log(` -> Upserting ${data.length} records for ${conf.name} into ${tableName}...`);
            // scraped_at is already added in scrapeConferenceStandings
            const { error } = await supabaseAdmin
                .from(tableName)
                .upsert(data, { onConflict: 'team_name' }); // Assuming team_name is unique constraint

            if (error) {
                console.error(` -> Supabase upsert error for ${tableName}: ${error.message}`);
                totalErrors++;
            } else {
                console.log(` -> Upsert successful for ${conf.name}.`);
                totalUpserted += data.length;
            }
        } else {
            console.log(` -> No data to upsert for ${conf.name}.`);
        }
        // Add a small delay between requests if needed, though less critical in Edge Functions
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`
Conference Scraping Complete.`);
    console.log(`  Total Records Processed/Upserted (Attempts): ${totalUpserted}`);
    console.log(`  Total Errors during Upsert: ${totalErrors}`);
    return { totalUpserted, totalErrors };
}

// --- Deno Serve Handler ---
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' 
    }});
  }

  // Ensure this is run via Supabase Functions scheduling or a secure trigger
  // Basic check: could add more security like a bearer token if needed
  // For scheduled functions, this might not be strictly necessary if access is locked down.
  // const authHeader = req.headers.get('Authorization');
  // if (!authHeader || authHeader !== `Bearer ${Deno.env.get('FUNCTION_SECRET')}`) {
  //     return new Response("Unauthorized", { status: 401 });
  // }

  try {
    console.log("Invoking conference standings scraper...");
    const { totalUpserted, totalErrors } = await runAllConferenceScrapers();
    
    const responsePayload = {
        message: `Conference Standings Scrape Job Complete. Records Upserted: ${totalUpserted}, Errors: ${totalErrors}`,
        processedCount: totalUpserted,
        errorCount: totalErrors,
    };

    return new Response(JSON.stringify(responsePayload), {
        headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
        status: 200,
    });
  } catch (error) {
    console.error("Error running conference scraper job:", error);
    return new Response(JSON.stringify({ error: error.message }), {
        headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
        status: 500,
    });
  }
});

/* 
To deploy and schedule this function:

1.  **Ensure Supabase CLI is installed and logged in.**
2.  **Deploy the function:**
    From your project root (`/Users/terronce/Documents/Code/laxbot`), run:
    ```bash
    supabase functions deploy conference-standings-scraper-job --no-verify-jwt
    ```
    *   `--no-verify-jwt` is often used for background jobs not requiring user auth. Adjust if needed.
3.  **Schedule the function using the Supabase Dashboard:**
    *   Go to your Supabase project dashboard.
    *   Navigate to "Database" -> "Functions Hooks" (or "Edge Functions" -> "Schedules" in newer UIs).
    *   Create a new schedule (or function hook).
    *   Select the `conference-standings-scraper-job` function.
    *   Set the schedule using Cron syntax: `0 8 * * *` (for 8:00 AM UTC daily).
    *   Save the schedule.

**Important Considerations:**
*   **Puppeteer Limitation:** This Edge Function cannot use Puppeteer. Scraping for conferences that heavily rely on JavaScript for rendering (like Big Ten and NEC, based on the original script's comments) might fail or be unreliable. If these are critical, you might need an alternative approach (e.g., a VM-based cron job, a different cloud function service that supports Puppeteer, or finding an API).
*   **Error Handling:** The script includes basic error handling, but you might want to enhance it (e.g., notifications on failure).
*   **Dependencies:** Ensure Deno and the Supabase CLI are set up correctly in your development and deployment environment.
*   **Environment Variables:** The function relies on `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` being set in the Supabase project's environment variables for Edge Functions.
*/ 