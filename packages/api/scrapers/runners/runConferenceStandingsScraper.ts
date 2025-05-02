import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
// Use standard puppeteer
import puppeteer, { Browser, Page } from 'puppeteer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// --- Type Definitions ---
interface ConferenceStandingData {
    team_name: string;
    conference_rank: number;
    conference_record?: string | null; // e.g., "5-0"
    conference_pct?: number | null; // e.g., 1.000
    overall_record?: string | null;  // e.g., "11-3"
    overall_pct?: number | null;   // e.g., 0.786
    streak?: string | null;          // e.g., "W6"
    // Add more fields based on common columns found
    raw_columns?: string[]; // Store raw text of all columns for debugging/future use
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
// --- End Setup ---

// --- Generic Conference Scraping Function ---
async function scrapeConferenceStandings(url: string, conferenceIdentifier: string): Promise<ConferenceStandingData[]> {
    console.log(` -> Scraping: ${conferenceIdentifier} from ${url}`);
    const scrapedData: ConferenceStandingData[] = [];
    let html = '';
    let browser: Browser | null = null;
    let page: Page | null = null; // Declare page here

    try {
        // --- Fetch HTML --- 
        // Enable Puppeteer for Big Ten AND NEC (LaxNumbers requires JS for consent manager)
        if (conferenceIdentifier === 'big_ten' || conferenceIdentifier === 'nec') { 
            console.log(`    -> Using Puppeteer to fetch rendered HTML for ${conferenceIdentifier}...`);
            try {
                // Use standard headless launch
                console.log(`    -> Launching Puppeteer (Headless: true) for ${conferenceIdentifier}...`);
                browser = await puppeteer.launch({ headless: true });
                page = await browser.newPage(); // Assign page here
                await page.setUserAgent('LaxBot/ConferenceScraper-Puppeteer/1.0');
                
                // Adjust waitUntil for script-heavy pages like LaxNumbers
                const waitOption = (conferenceIdentifier === 'nec') ? 'domcontentloaded' : 'networkidle0';
                console.log(`    -> Navigating with waitUntil: '${waitOption}'`);
                await page.goto(url, { waitUntil: waitOption, timeout: 60000 });

                html = await page.content();
                // No close here, let finally handle it
                console.log(`    -> Puppeteer finished fetching ${conferenceIdentifier} HTML.`);
            } catch (puppeteerError: any) {
                console.error(`    -> Puppeteer failed for ${conferenceIdentifier}: ${puppeteerError.message}`);
                // If Puppeteer failed, try logging the HTML we might have gotten before the error
                 try {
                     const failedHtml = await page?.content(); // Use optional chaining
                     if (failedHtml) {
                        console.error("    -> HTML content at time of Puppeteer failure:");
                        console.error(failedHtml.substring(0, 2000));
                     }
                 } catch (contentError: any) {
                     console.error(`    -> Could not get page content after Puppeteer failure: ${contentError.message}`);
                 }
                return []; // Exit early if puppeteer fails
            }
        } else {
            // Use Fetch for other conferences
            const response = await fetch(url, { 
                headers: { 'User-Agent': 'LaxBot/ConferenceScraper/1.0' } 
            });
            if (!response.ok) {
                // No need to specifically check for NEC 500 here anymore
                throw new Error(`HTTP error ${response.status}`);
            }
            html = await response.text();
        }
        // --- End Fetch HTML ---

        // If HTML is empty after fetch/puppeteer, skip
        if (!html) {
            console.warn(`    -> No HTML content fetched for ${conferenceIdentifier}. Skipping.`);
            return [];
        }

        const $ = cheerio.load(html);
        let table = $(); // Initialize with empty Cheerio object

        // --- Find Table Logic --- 
        if (conferenceIdentifier === 'big_ten') {
            console.log('    -> Applying Big Ten specific table finding logic on rendered HTML...');
            const knownBigTenTeams = ['Maryland', 'Penn St', 'Ohio St', 'Michigan', 'Johns Hopkins', 'Rutgers'];
            let foundTable = false;
            $('table').each((_i, elem) => {
                const currentTable = $(elem);
                const tableText = currentTable.text();
                let matches = 0;
                knownBigTenTeams.forEach(teamName => { if (tableText.includes(teamName)) matches++; });
                if (matches >= 4) {
                    console.log('    -> Found likely Big Ten standings table based on team names.');
                    table = currentTable;
                    foundTable = true;
                    return false;
                }
            });
            if (!foundTable) {
                 console.warn(`    -> Could not find Big Ten table using team name check. Skipping.`);
                 return [];
            }
        } else if (conferenceIdentifier === 'nec') {
            // NEC logic for Inside Lacrosse /league/DI/teams page
            console.log('    -> Applying NEC specific table finding logic (Inside Lacrosse /teams page)...');
            
            // Find the TH containing the exact text 'NEC'
            const necHeaderCell = $('th').filter((_i, el) => $(el).text().trim() === 'NEC');
            
             if (necHeaderCell.length === 0) {
                console.warn('    -> Could not find NEC header cell <th>NEC</th> on Inside Lacrosse page. Skipping.');
                return [];
            }
            // The table is the parent table element of this header cell
             table = necHeaderCell.closest('table');
            
            if (table.length === 0) {
                console.warn('    -> Could not find parent table for NEC header cell. Skipping.');
                return [];
            }
             console.log('    -> Found NEC table on Inside Lacrosse /teams page.');
        } else {
            // Default Selector Logic (for other conferences)
            table = $('table.sidearm-standings-table');
            if (table.length === 0) table = $('#standings-table');
            if (table.length === 0) table = $('table.table');
            if (table.length === 0) table = $('table').first();
            
            if (table.length === 0) {
                console.warn(`    -> No table found matching common selectors for ${conferenceIdentifier}. Skipping.`);
                return [];
            }
        }
        // --- End Find Table Logic ---
        
        console.log(`    -> Table found for ${conferenceIdentifier}. Processing rows...`);
        const rows = table.find('tbody > tr'); 
        rows.each((index, element: any) => { // Use any for element type
            const columns = $(element).find('td');
            const rawColumns: string[] = [];
            // Use any for col type and ensure no return value from push
            columns.each((_i: number, col: any) => { 
                rawColumns.push($(col).text().trim()); 
            });

            if (rawColumns.length > 0) { 
                let team_name: string = 'Unknown Team';
                let conference_record: string | null = null;
                let conference_pct_str: string | null = null;
                let overall_record: string | null = null;
                let overall_pct_str: string | null = null;
                let streak: string | null = null;
                let conference_rank = index + 1;

                try {
                    let team_name_raw: string | null = null;
                    let overall_record_raw: string | null = null;
                    let conf_w: string | null = null;
                    let conf_l: string | null = null;

                    if (conferenceIdentifier === 'nec') {
                        // Inside Lacrosse NEC Table Parsing (Reinstated)
                        // Columns: Team (Overall W-L), Conf W, Conf L
                        team_name_raw = rawColumns[0]?.trim() || null;
                        conf_w = rawColumns[1]?.trim() || null;
                        conf_l = rawColumns[2]?.trim() || null;

                        if (team_name_raw) {
                            const match = team_name_raw.match(/^(.*?)\s*\((\d+-\d+)\)$/);
                            if (match) {
                                team_name = match[1].trim();
                                overall_record = match[2]; // Format: "W-L"
                            } else {
                                team_name = team_name_raw; // Fallback if no record found
                            }
                        } else {
                             team_name = 'Unknown Team'; // Ensure team_name is set if raw is null
                        }
                         conference_record = (conf_w && conf_l) ? `${conf_w}-${conf_l}` : null;
                         conference_rank = index + 1; // Use simple row index for rank
                         
                         // Other fields are null as they aren't present on this table
                         conference_pct_str = null;
                         overall_pct_str = null;
                         streak = null;

                    } else {
                         // Original Parsing Logic for other conferences
                         team_name = rawColumns[1]?.trim() || rawColumns[0]?.trim() || 'Unknown Team';
                         conference_record = rawColumns[2]?.trim() || null;
                         conference_pct_str = rawColumns[3]?.trim() || null;
                         overall_record = rawColumns[4]?.trim() || null;
                         overall_pct_str = rawColumns[5]?.trim() || null;
                         streak = rawColumns[6]?.trim() || null;
                         // Clean up team name (remove trailing annotations)
                         team_name = team_name.replace(/\s*[*#^!xy]+$/, '').trim(); 
                    }

                    const parsePct = (pctStr: string | null): number | null => {
                        if (!pctStr) return null;
                        const num = parseFloat(pctStr);
                        return isNaN(num) ? null : num;
                    };
                    
                    if (team_name && team_name !== 'Unknown Team') {
                        const standingEntry: ConferenceStandingData = {
                            team_name: team_name,
                            conference_rank: conference_rank, 
                            conference_record: conference_record,
                            conference_pct: parsePct(conference_pct_str),
                            overall_record: overall_record,
                            overall_pct: parsePct(overall_pct_str),
                            streak: streak,
                            raw_columns: rawColumns
                        };
                        scrapedData.push(standingEntry);
                    } else {
                         console.warn(`    -> Skipping row ${index} for ${conferenceIdentifier}: Could not parse valid team name from [${rawColumns[0]}, ${rawColumns[1]}]`);
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
        // Log the error, finally will clean up the browser if needed.
        // We might still have partial data or need to return empty
        return []; // Exit if there's a major error during fetch/parse
    } finally {
        // This block ALWAYS runs, ensuring cleanup
        if (browser) {
            console.log(`    -> Cleaning up Puppeteer browser instance for ${conferenceIdentifier}...`);
            try {
                await browser.close();
            } catch (closeError: any) {
                console.error(`    -> Error closing Puppeteer browser: ${closeError.message}`);
            }
            // No need to set browser = null here, it goes out of scope anyway
        }
    }
    return scrapedData;
}

// --- Main Runner Logic ---
async function runAllConferenceScrapers() {
    console.log('Starting all conference scrapers...');
    
    const conferences = [
        { name: 'ivy_league', url: 'https://ivyleague.com/standings.aspx?path=mlax' },
        { name: 'acc', url: 'https://theacc.com/standings.aspx?path=mlax' },
        { name: 'big_ten', url: 'https://bigten.org/standings.aspx?path=mlax' },
        { name: 'patriot', url: 'https://patriotleague.org/standings.aspx?path=mlax' },
        { name: 'big_east', url: 'https://www.bigeast.com/standings.aspx?path=mlax' },
        { name: 'caa', url: 'https://caasports.com/standings.aspx?path=mlax' },
        { name: 'asun', url: 'https://asunsports.org/standings.aspx?path=mlax' },
        { name: 'america_east', url: 'https://americaeast.com/standings.aspx?path=mlax' },
        { name: 'nec', url: 'https://www.insidelacrosse.com/league/DI/teams' },
        { name: 'atlantic_10', url: 'https://atlantic10.com/standings.aspx?path=MLAX' }
    ];

    let totalUpserted = 0;
    let totalErrors = 0;

    for (const conf of conferences) {
        const tableName = `stg_conf_${conf.name}`; 
        const data = await scrapeConferenceStandings(conf.url, conf.name);

        if (data.length > 0) {
            console.log(` -> Upserting ${data.length} records for ${conf.name} into ${tableName}...`);
            const payload = data.map(item => ({ ...item, scraped_at: new Date().toISOString() }));
            const { error } = await supabase
                .from(tableName)
                .upsert(payload, { onConflict: 'team_name' }); 
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
        await new Promise(resolve => setTimeout(resolve, 500)); 
    }

    console.log(`\nConference Scraping Complete.`);
    console.log(`  Total Records Processed/Upserted (Attempts): ${totalUpserted}`);
    console.log(`  Total Errors during Upsert: ${totalErrors}`);
}

// --- Run the Scraper ---
runAllConferenceScrapers();
