import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// --- Type Definitions ---
interface RpiScrapedData {
    rank: number;
    school_name: string;
    conference: string;
    record: string;
    // Add other fields like road, neutral, home if needed
}
// --- End Type Definitions ---

// --- Environment & Supabase Client Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../../../.env'); // Relative to runners dir
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const NCAA_RPI_URL = 'https://www.ncaa.com/rankings/lacrosse-men/d1/ncaa-mens-lacrosse-rpi';
const STAGING_TABLE = 'stg_ncaa_rpi'; // Target staging table name
// --- End Setup ---


// --- Main Scraping Function ---
async function scrapeNcaaRpi() {
    console.log(`Starting NCAA RPI scrape from: ${NCAA_RPI_URL}`);
    let processedCount = 0;
    let errorCount = 0;
    const scrapedData: RpiScrapedData[] = [];

    try {
        // 1. Fetch HTML content
        console.log('Fetching HTML content...');
        const response = await fetch(NCAA_RPI_URL, { 
            headers: { 
                // Add a user-agent to be polite
                'User-Agent': 'LaxBot/NcaaRpiScraper/1.0' 
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch HTML: ${response.status} ${response.statusText}`);
        }
        const html = await response.text();
        console.log('HTML fetched successfully.');

        // 2. Parse HTML with Cheerio
        const $ = cheerio.load(html);
        
        // Find the main rankings table
        // Inspecting the HTML (via browser dev tools) is needed to confirm the selector.
        // Let's assume it's the first (or only) table on the page for now.
        // More specific selectors like classes or IDs are preferred if available.
        const table = $('table').first(); 
        if (table.length === 0) {
            throw new Error('Could not find the rankings table in the HTML.');
        }
        console.log('Rankings table found.');

        // 3. Iterate through table rows and extract data
        const rows = table.find('tbody > tr'); // Find rows in the table body
        console.log(`Found ${rows.length} rows in the table body.`);
        
        rows.each((index, element) => {
            const columns = $(element).find('td'); // Find cells within the row
            if (columns.length >= 4) { // Ensure we have enough columns
                try {
                    const rank = parseInt($(columns[0]).text().trim(), 10);
                    const school_name = $(columns[1]).text().trim();
                    const conference = $(columns[2]).text().trim();
                    const record = $(columns[3]).text().trim();

                    if (!isNaN(rank) && school_name) {
                        scrapedData.push({
                            rank,
                            school_name,
                            conference,
                            record
                        });
                    } else {
                        console.warn(`Skipping row ${index + 1}: Invalid rank or missing school name.`);
                    }
                } catch (parseError: any) {
                    console.error(`Error parsing row ${index + 1}: ${parseError.message}`);
                    errorCount++;
                }
            } else {
                 console.warn(`Skipping row ${index + 1}: Expected at least 4 columns, found ${columns.length}.`);
            }
        });

        console.log(`Extracted data for ${scrapedData.length} teams.`);

        // 4. Upsert data into the staging table
        if (scrapedData.length > 0) {
            console.log(`Upserting ${scrapedData.length} records into staging table: ${STAGING_TABLE}...`);
            // We'll use rank as the conflict target to just store the latest list.
            // Add scraped_at timestamp
            const payloadWithTimestamp = scrapedData.map(item => ({ 
                ...item, 
                scraped_at: new Date().toISOString()
             }));

            const { error: upsertError } = await supabase
                .from(STAGING_TABLE)
                .upsert(payloadWithTimestamp, { 
                    onConflict: 'rank' // Assumes rank is unique and suitable as conflict target
                });

            if (upsertError) {
                throw new Error(`Supabase upsert error: ${upsertError.message}`);
            }
            processedCount = scrapedData.length;
            console.log('Upsert successful.');
        } else {
            console.log('No data extracted to upsert.');
        }

    } catch (err: any) {
        console.error(`Fatal error during NCAA RPI scrape: ${err.message}`);
        errorCount++; // Count the fatal error
    } finally {
        console.log(`\nNCAA RPI Scrape Complete.`);
        console.log(`  Records Upserted: ${processedCount}`);
        console.log(`  Errors encountered: ${errorCount}`);
    }
}

// --- Run the script ---
scrapeNcaaRpi(); 