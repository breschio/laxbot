import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as cheerio from 'https://esm.sh/cheerio@1.0.0-rc.12';

// Define CORS headers for potential direct invocation testing (optional but good practice)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow requests from any origin
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Type Definitions (copied from Node script) ---
interface RpiScrapedData {
    rank: number;
    school_name: string;
    conference: string;
    record: string;
}
// --- End Type Definitions ---

const NCAA_RPI_URL = 'https://www.ncaa.com/rankings/lacrosse-men/d1/ncaa-mens-lacrosse-rpi';
const STAGING_TABLE = 'stg_ncaa_rpi';

console.log('NCAA RPI Scraper function initializing...');

Deno.serve(async (req) => {
  // Handle potential CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('Received request to run NCAA RPI scrape...');
  let processedCount = 0;
  let errorCount = 0;
  const scrapedData: RpiScrapedData[] = [];

  try {
    // --- Get Supabase client --- 
    // Ensure environment variables are set in Supabase Function settings
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY'); // Use anon key for client, service_role for admin tasks
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); // Needed for DB write

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables (URL or Service Role Key)');
    }

    // Use service role key for database operations within the function
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    console.log('Supabase client initialized.');
    // --- End Client Setup ---

    // 1. Fetch HTML content
    console.log(`Fetching HTML from: ${NCAA_RPI_URL}`);
    const response = await fetch(NCAA_RPI_URL, {
        headers: { 'User-Agent': 'SupabaseEdgeFunction/LaxBot/NcaaRpiScraper/1.0' }
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch HTML: ${response.status} ${response.statusText}`);
    }
    const html = await response.text();
    console.log('HTML fetched successfully.');

    // 2. Parse HTML with Cheerio
    const $ = cheerio.load(html);
    const table = $('table').first();
    if (table.length === 0) {
        throw new Error('Could not find the rankings table in the HTML.');
    }
    console.log('Rankings table found.');

    // 3. Iterate through table rows and extract data
    const rows = table.find('tbody > tr');
    console.log(`Found ${rows.length} rows.`);
    rows.each((index, element) => {
        const columns = $(element).find('td');
        if (columns.length >= 4) {
            try {
                const rank = parseInt($(columns[0]).text().trim(), 10);
                const school_name = $(columns[1]).text().trim();
                const conference = $(columns[2]).text().trim();
                const record = $(columns[3]).text().trim();

                if (!isNaN(rank) && school_name) {
                    scrapedData.push({ rank, school_name, conference, record });
                } else {
                    console.warn(`Skipping row ${index + 1}: Invalid data.`);
                }
            } catch (parseError: any) {
                console.error(`Error parsing row ${index + 1}: ${parseError.message}`);
                errorCount++;
            }
        } else {
             console.warn(`Skipping row ${index + 1}: Found ${columns.length} columns.`);
        }
    });
    console.log(`Extracted data for ${scrapedData.length} teams.`);

    // 4. Upsert data into the staging table
    if (scrapedData.length > 0) {
        console.log(`Upserting ${scrapedData.length} records into ${STAGING_TABLE}...`);
        const payloadWithTimestamp = scrapedData.map(item => ({ 
            ...item, 
            scraped_at: new Date().toISOString()
         }));

        const { error: upsertError } = await supabaseAdmin
            .from(STAGING_TABLE)
            .upsert(payloadWithTimestamp, { onConflict: 'rank' });

        if (upsertError) {
            throw new Error(`Supabase upsert error: ${upsertError.message}`);
        }
        processedCount = scrapedData.length;
        console.log('Upsert successful.');
    } else {
        console.log('No data extracted to upsert.');
    }

    // --- Return Success Response ---
    const responsePayload = {
      message: `NCAA RPI Scrape Complete. Records Upserted: ${processedCount}, Errors: ${errorCount}`,
      processedCount,
      errorCount
    };
    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err: any) {
    console.error('Fatal error in Edge Function:', err);
    // --- Return Error Response ---
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

console.log('NCAA RPI Scraper function handler registered.');
