import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';

// Get directory path in ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from root directory
const envPath = resolve(__dirname, '../../../../.env');
console.log('Loading .env from:', envPath);
config({ path: envPath });

// ESPN API endpoint for NCAA Men's Lacrosse
const ESPN_SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/lacrosse/mens-college-lacrosse/scoreboard';

// Path for storing the latest data as a file backup
const LATEST_DATA_PATH = path.resolve(__dirname, '../data/latest-scoreboard.json');

async function scrapeScoreboard() {
  console.log('[ScoreboardScraper] Starting ESPN scoreboard scraper...');
  
  // Initialize Supabase client
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  }
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Fetch data from ESPN API
    console.log(`[ScoreboardScraper] Fetching data from ESPN: ${ESPN_SCOREBOARD_URL}`);
    const response = await fetch(ESPN_SCOREBOARD_URL);
    
    if (!response.ok) {
      throw new Error(`ESPN API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[ScoreboardScraper] Successfully fetched data, found ${data.events?.length || 0} events`);
    
    // Ensure data directory exists
    try {
      if (!fs.existsSync(path.dirname(LATEST_DATA_PATH))) {
        fs.mkdirSync(path.dirname(LATEST_DATA_PATH), { recursive: true });
      }
      
      // Save the data as JSON file for backup
      fs.writeFileSync(LATEST_DATA_PATH, JSON.stringify(data, null, 2));
      console.log(`[ScoreboardScraper] Saved latest data to ${LATEST_DATA_PATH}`);
    } catch (fileError) {
      console.error('[ScoreboardScraper] Error saving data to file:', fileError);
      // Non-fatal error, continue
    }
    
    // Check if the stgScoreboard table exists
    try {
      // Try to store data in stgScoreboard table
      const { error: insertError } = await supabase
        .from('stgScoreboard')
        .insert({
          source_id: 'espn-scoreboard',
          raw_payload: data,
          scraped_at: new Date().toISOString()
        });
      
      if (insertError) {
        // Check the specific error message
        if (insertError.message && insertError.message.includes('does not exist')) {
          console.log('[ScoreboardScraper] stgScoreboard table does not exist yet. Using sample data mode.');
          console.log('[ScoreboardScraper] Data will be processed using the sample data in the parser.');
        } else {
          console.error('[ScoreboardScraper] Error inserting data:', insertError);
        }
      } else {
        console.log('[ScoreboardScraper] Successfully stored data in stgScoreboard table');
      }
      
    } catch (storageError) {
      console.error('[ScoreboardScraper] Error storing data:', storageError);
    }
    
    // For debugging, also print some basic information about the data
    if (data.events && data.events.length > 0) {
      console.log('\n[ScoreboardScraper] Sample of events:');
      data.events.slice(0, 3).forEach((event: any) => {
        console.log(`- ${event.name || 'Unnamed event'}: ${event.status?.type?.description || 'Unknown status'}`);
        if (event.competitions && event.competitions.length > 0) {
          const competition = event.competitions[0];
          if (competition.competitors && competition.competitors.length > 0) {
            competition.competitors.forEach((team: any) => {
              console.log(`  * ${team.team.displayName} (${team.team.abbreviation}): ${team.score || 'No score'}`);
            });
          }
        }
      });
    }
    
    console.log('[ScoreboardScraper] Scraping completed successfully');
    
  } catch (error) {
    console.error('[ScoreboardScraper] Error during scraping:', error);
    process.exit(1);
  }
}

// Self-execute when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeScoreboard()
    .then(() => console.log('[ScoreboardScraper] Scraper completed'))
    .catch(err => {
      console.error('[ScoreboardScraper] Fatal error:', err);
      process.exit(1);
    });
} 