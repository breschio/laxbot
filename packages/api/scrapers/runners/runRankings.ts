import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// --- Type Definitions for ESPN API Response ---
interface Logo {
  href: string;
  width?: number;
  height?: number;
  alt?: string;
  rel?: string[];
}

interface TeamData {
  id: string;
  location?: string;
  nickname?: string;
  abbreviation?: string;
  name?: string; // Sometimes used instead of location/nickname
  school?: string; // Potentially available
  logos?: Logo[];
}

interface RankEntry {
  team: TeamData;
  current: number;
  // Add other potential fields if needed
}

interface Season {
    year: number;
    // Add other potential fields if needed
}

interface Occurrence {
    number: number;
    // Add other potential fields if needed
}

interface Poll {
  name?: string;
  ranks?: RankEntry[];
  season?: Season;
  occurrence?: Occurrence;
  // Add other potential fields if needed
}

interface EspnRankingsResponse {
  rankings?: Poll[];
  season?: Season; // Top-level season info might exist
}
// --- End Type Definitions ---

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../../../.env');
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(`SUPABASE_URL: ${SUPABASE_URL ? 'Loaded' : 'Missing'}`);
  console.error(`SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? 'Loaded' : 'Missing'}`);
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const RANKINGS_URL =
  'https://site.api.espn.com/apis/site/v2/sports/lacrosse/mens-college-lacrosse/rankings?seasontype=2';

async function runRankings() {
  console.log('Fetching ESPN rankings...');
  const response = await fetch(RANKINGS_URL, { headers: { 'User-Agent': 'LaxBot/1.0' } });
  if (!response.ok) {
    const body = await response.text();
    console.error('ESPN API Error Body:', body);
    throw new Error(`ESPN rankings fetch failed: ${response.status}`);
  }

  const data = await response.json() as EspnRankingsResponse;
  const polls = data.rankings || [];
  if (!polls.length) {
    console.log('No ranking polls found.');
    return;
  }

  // Define accumulators outside the loop
  const upsertPayload = [];
  const skipped: string[] = []; // Add type for skipped IDs

  // --- Loop through ALL polls --- 
  for (const poll of polls) {
    const list = poll.ranks || [];
    const pollName = poll.name || 'ESPN'; // Get name from current poll
    console.log(`Processing poll: "${pollName}" with ${list.length} teams...`);

    if (!list.length) {
      console.log(`  - No rankings found in poll "${pollName}". Skipping.`);
      continue; // Skip to the next poll if this one has no ranks
    }

    // Get year/week from the current poll or fallback
    const year = poll.season?.year || data.season?.year || new Date().getFullYear();
    const week = poll.occurrence?.number || null;

    // Define type for the matched team from Supabase (can stay outside loops)
    interface SupabaseTeam {
        id: string;
    }

    // --- Inner loop processing teams within the current poll ---
    for (const entry of list) {
      const espnId = String(entry.team.id);
      let team: SupabaseTeam | null = null; 

      // --- Team Matching Logic (remains the same) ---
      // 1) Match by espn_id
      try {
        const { data: t, error } = await supabase
          .from('teams')
          .select('id')
          .eq('espn_id', espnId)
          .maybeSingle();
        if (!error && t) team = t;
      } catch {}

      // 2) Match by abbreviation
      if (!team && entry.team.abbreviation) {
        const abbrev = entry.team.abbreviation.trim();
        try {
          const { data: t, error } = await supabase
            .from('teams')
            .select('id')
            .ilike('abbreviation', `%${abbrev}%`)
            .maybeSingle();
          if (!error && t) {
            await supabase.from('teams').update({ espn_id: espnId }).eq('id', t.id);
            team = t;
          }
        } catch {}
      }

      // 3) Match by full name (location + nickname)
      if (!team && entry.team.location && entry.team.nickname) {
        const fullName = `${entry.team.location} ${entry.team.nickname}`;
        try {
          const { data: t, error } = await supabase
            .from('teams')
            .select('id')
            .ilike('name', `%${fullName}%`)
            .maybeSingle();
          if (!error && t) {
            await supabase.from('teams').update({ espn_id: espnId }).eq('id', t.id);
            team = t;
          }
        } catch {}
      }

      // 4) Match by name or nickname
      if (!team && (entry.team.name || entry.team.nickname)) {
        const lookup = entry.team.name || entry.team.nickname;
        try {
          const { data: t, error } = await supabase
            .from('teams')
            .select('id')
            .ilike('name', `%${lookup}%`)
            .maybeSingle();
          if (!error && t) {
            await supabase.from('teams').update({ espn_id: espnId }).eq('id', t.id);
            team = t;
          }
        } catch {}
      }

      // 5) Match by school
      if (!team) {
        const lookupSchool = entry.team.name || entry.team.nickname;
        try {
          const { data: t, error } = await supabase
            .from('teams')
            .select('id')
            .ilike('school', `%${lookupSchool}%`)
            .maybeSingle();
          if (!error && t) {
            await supabase.from('teams').update({ espn_id: espnId }).eq('id', t.id);
            team = t;
          }
        } catch {}
      }
      // --- End Team Matching Logic ---

      if (!team) {
        if (!skipped.includes(espnId)) { // Avoid adding duplicate skipped IDs
             skipped.push(espnId);
        }
        continue; // Skip to the next entry in the inner loop
      }
      
      // --- Logo Extraction/Update Logic (remains the same) ---
      let logoUrl = null;
      if (entry.team.logos && entry.team.logos.length > 0 && entry.team.logos[0].href) {
        logoUrl = entry.team.logos[0].href;
        try {
          const { error: updateError } = await supabase
            .from('teams')
            .update({ logo_url: logoUrl })
            .eq('id', team.id);
          if (updateError) {
              console.warn(`Failed to update logo URL for team ${team.id}:`, updateError.message);
          }
        } catch (e) {
           console.warn(`Exception updating logo URL for team ${team.id}:`, e);
        }
      }
      // --- End Logo Logic ---

      // Add to the main payload (accumulated across all polls)
      upsertPayload.push({
        team_id: team.id,
        year,
        week,
        poll_name: pollName,
        rank: entry.current,
        updated_at: new Date().toISOString(),
      });
    } // --- End inner team loop ---
  } // --- End outer poll loop ---

  // --- Upsert and Refresh logic (remains outside loops) ---
  if (upsertPayload.length) {
    // Define type for upsert payload items
    type RankingUpsert = typeof upsertPayload[0];
    const { error } = await supabase
      .from('rankings')
      .upsert(upsertPayload as RankingUpsert[], { onConflict: 'team_id, year, week, poll_name' }); 
    if (error) console.error('Upsert error:', error.message);
    else console.log(`Upserted ${upsertPayload.length} total records from all polls.`);
  }

  console.log(`Skipped IDs across all polls: ${skipped.join(', ') || 'None'}`);

  // Refresh view
  try {
    console.log('Refreshing rankings_full view...');
    const { error } = await supabase.rpc('refresh_rankings_full');
    if (error) console.error('Refresh error:', error.message);
    else console.log('Materialized view refreshed.');
  } catch {}
}

runRankings();
