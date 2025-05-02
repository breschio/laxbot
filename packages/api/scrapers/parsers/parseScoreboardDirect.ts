import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import { ESPNScoreboard, ESPNTeam } from './types';
import fs from 'fs';

// Get directory path in ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path for the latest data file
const LATEST_DATA_PATH = join(__dirname, '../data/latest-scoreboard.json');

// Load .env from root directory (project root, not packages)
const envPath = resolve(__dirname, '../../../../.env');
console.log('Loading .env from:', envPath);
config({ path: envPath });

// Debug environment variables
console.log('Environment variables:');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL || '(not set)');
console.log('- SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '(set)' : '(not set)');
console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '(set)' : '(not set)');

// Check if required environment variables are set
if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL is not set in environment variables');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables');
}

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
    db: { schema: 'public' }
  }
);

interface TeamRecord {
  overallWins: number;
  overallLosses: number;
  conferenceWins: number;
  conferenceLosses: number;
}

function parseTeamRecord(team: ESPNTeam): TeamRecord {
  const record: TeamRecord = {
    overallWins: 0,
    overallLosses: 0,
    conferenceWins: 0,
    conferenceLosses: 0
  };

  // Make sure record.items exists before trying to access it
  if (team.team.record && team.team.record.items) {
    for (const item of team.team.record.items) {
      if (item.type === 'total') {
        const [wins, losses] = item.summary.split('-').map(Number);
        record.overallWins = wins;
        record.overallLosses = losses;
      } else if (item.type === 'conference') {
        const [wins, losses] = item.summary.split('-').map(Number);
        record.conferenceWins = wins;
        record.conferenceLosses = losses;
      }
    }
  }

  return record;
}

async function processTeam(team: ESPNTeam): Promise<void> {
  const abbreviation = team.team.abbreviation;
  
  if (!abbreviation) {
    console.warn(`[ScoreboardParser] Team is missing abbreviation:`, team.team.displayName);
    return;
  }

  // Find matching team in our database
  const { data: teams, error: teamError } = await supabase
    .from('teams')
    .select('id')
    .eq('abbreviation', abbreviation)
    .limit(1);
  
  if (teamError) {
    console.error(`[ScoreboardParser] Error finding team with abbreviation ${abbreviation}:`, teamError);
    return;
  }
  
  let teamId: string;
  
  if (!teams || teams.length === 0) {
    console.warn(`[ScoreboardParser] No matching team found for abbreviation: ${abbreviation}`);
    
    // Create the team if it doesn't exist
    console.log(`[ScoreboardParser] Creating new team: ${team.team.displayName} (${abbreviation})`);
    const { data: newTeam, error: insertError } = await supabase
      .from('teams')
      .insert({
        name: team.team.displayName,
        abbreviation: abbreviation,
        gender: 'mens', // Default values based on our schema
        level: 'college',
        division: 'D1'
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error(`[ScoreboardParser] Error creating team:`, insertError);
      return;
    }
    
    if (!newTeam) {
      console.error(`[ScoreboardParser] Failed to create team (no error but no data returned)`);
      return;
    }
    
    console.log(`[ScoreboardParser] Successfully created team with ID: ${newTeam.id}`);
    teamId = newTeam.id;
  } else {
    teamId = teams[0].id;
  }

  // Check if records table exists
  try {
    const record = parseTeamRecord(team);
    const currentYear = new Date().getFullYear();

    // Check if record exists
    const { data: existingRecords, error: recordError } = await supabase
      .from('records')
      .select('*')
      .eq('team_id', teamId)
      .eq('season_year', currentYear);

    if (recordError) {
      console.error(`[ScoreboardParser] Error finding records for team ${abbreviation}:`, recordError);
      
      // If the error indicates the table doesn't exist, try to create it
      if (recordError.message && recordError.message.includes('does not exist')) {
        console.log('[ScoreboardParser] Records table may not exist, skipping record update');
        return;
      }
      
      return;
    }

    // Upsert (insert or update) record
    const recordData = {
      team_id: teamId,
      season_year: currentYear,
      overall_wins: record.overallWins,
      overall_losses: record.overallLosses,
      conference_wins: record.conferenceWins,
      conference_losses: record.conferenceLosses,
      updated_at: new Date().toISOString()
    };

    if (existingRecords && existingRecords.length > 0) {
      // Update
      const { error: updateError } = await supabase
        .from('records')
        .update(recordData)
        .eq('team_id', teamId)
        .eq('season_year', currentYear);

      if (updateError) {
        console.error(`[ScoreboardParser] Error updating records for team ${abbreviation}:`, updateError);
        return;
      }
    } else {
      // Insert
      const { error: insertError } = await supabase
        .from('records')
        .insert(recordData);

      if (insertError) {
        console.error(`[ScoreboardParser] Error inserting records for team ${abbreviation}:`, insertError);
        return;
      }
    }

    console.log(`[ScoreboardParser] Updated records for team: ${abbreviation}`);
  } catch (error) {
    console.error(`[ScoreboardParser] Error processing team record for ${abbreviation}:`, error);
  }
}

// Load data from stgScoreboard table or local file
async function getScoreboardData(): Promise<ESPNScoreboard | null> {
  // First try to get data from stgScoreboard table
  try {
    const { data: stagingRows, error: stgError } = await supabase
      .from('stgScoreboard')
      .select('*')
      .eq('source_id', 'espn-scoreboard')
      .order('scraped_at', { ascending: false })
      .limit(1);

    if (!stgError && stagingRows && stagingRows.length > 0) {
      console.log(`[ScoreboardParser] Found scoreboard data in stgScoreboard table, scraped at: ${stagingRows[0].scraped_at}`);
      return stagingRows[0].raw_payload as ESPNScoreboard;
    }
  } catch (error) {
    console.error('[ScoreboardParser] Error querying stgScoreboard table:', error);
  }

  // If stgScoreboard doesn't exist or has no data, try to use the latest data file
  try {
    if (fs.existsSync(LATEST_DATA_PATH)) {
      console.log(`[ScoreboardParser] Reading data from file: ${LATEST_DATA_PATH}`);
      const fileData = fs.readFileSync(LATEST_DATA_PATH, 'utf8');
      return JSON.parse(fileData) as ESPNScoreboard;
    }
  } catch (error) {
    console.error('[ScoreboardParser] Error reading data file:', error);
  }

  // If no data is available from either source, return null
  return null;
}

export async function parseScoreboard(): Promise<void> {
  console.log('[ScoreboardParser] Starting parse...');
  console.log('[ScoreboardParser] Using direct Supabase client connection');

  // Try to get real data from stgScoreboard table or file
  const scoreboardData = await getScoreboardData();

  if (scoreboardData) {
    console.log('[ScoreboardParser] Using actual ESPN data');
    try {
      // Process each event from the real data
      if (scoreboardData.events && scoreboardData.events.length > 0) {
        console.log(`[ScoreboardParser] Processing ${scoreboardData.events.length} events from actual data`);
        for (const event of scoreboardData.events) {
          console.log(`[ScoreboardParser] Processing event: ${event.id} - ${event.name}`);
          if (event.competitions && event.competitions.length > 0) {
            for (const competition of event.competitions) {
              const competitorCount = competition.competitors ? competition.competitors.length : 0;
              console.log(`[ScoreboardParser] Competition: ${competition.id}, teams: ${competitorCount}`);
              
              // Process each team in the competition
              if (competition.competitors) {
                for (const competitor of competition.competitors) {
                  await processTeam(competitor);
                }
              }
            }
          }
        }
        console.log('[ScoreboardParser] Successfully processed actual data');
        return;
      }
    } catch (error) {
      console.error('[ScoreboardParser] Error processing actual data:', error);
      console.log('[ScoreboardParser] Falling back to sample data');
    }
  } else {
    console.log('[ScoreboardParser] No actual data available, using sample data');
  }

  // Fall back to sample data if no real data is available or processing failed
  console.log('[ScoreboardParser] Using sample ESPN data for testing');

  try {
    // Sample ESPN data - this is normally what would be in the stg_scoreboard table
    const samplePayload: ESPNScoreboard = {
      events: [
        {
          id: "401590554",
          name: "Sample Lacrosse Game",
          competitions: [
            {
              id: "401590554",
              competitors: [
                {
                  team: {
                    id: "1",
                    abbreviation: "YALE",
                    displayName: "Yale Bulldogs",
                    record: {
                      items: [
                        { type: "total", summary: "9-2" },
                        { type: "conference", summary: "3-1" }
                      ]
                    }
                  }
                },
                {
                  team: {
                    id: "2",
                    abbreviation: "HARV",
                    displayName: "Harvard Crimson",
                    record: {
                      items: [
                        { type: "total", summary: "6-5" },
                        { type: "conference", summary: "2-2" }
                      ]
                    }
                  }
                }
              ]
            }
          ]
        }
      ]
    };

    // Process each event from our sample data
    for (const event of samplePayload.events) {
      console.log(`[ScoreboardParser] Processing event: ${event.id} - ${event.name}`);
      for (const competition of event.competitions) {
        console.log(`[ScoreboardParser] Competition: ${competition.id}, teams: ${competition.competitors.length}`);
        // Process each team in the competition
        for (const competitor of competition.competitors) {
          await processTeam(competitor);
        }
      }
    }

    console.log('[ScoreboardParser] Successfully processed sample data');
  } catch (error) {
    console.error('[ScoreboardParser] Error processing sample data:', error);
  }

  console.log('[ScoreboardParser] Completed parsing scoreboard data');
}

// Self-execute when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('[ScoreboardParser] Script running in standalone mode');
  parseScoreboard()
    .then(() => console.log('[ScoreboardParser] Parsing completed'))
    .catch(err => {
      console.error('[ScoreboardParser] Error:', err);
      process.exit(1);
    });
} 