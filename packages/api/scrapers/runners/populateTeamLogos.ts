import fetch from 'node-fetch';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve, extname } from 'path';
import { URL } from 'url'; // To handle URL parsing for extension

// --- Type Definitions ---
// Keep necessary types for ESPN response parsing and team matching
interface Logo {
  href: string;
  width?: number;
  height?: number;
  alt?: string;
  rel?: string[];
}

interface TeamData {
  id: string; // ESPN ID
  location?: string;
  nickname?: string;
  abbreviation?: string;
  name?: string;
  logos?: Logo[];
}

interface RankEntry {
  team: TeamData;
  current: number; // Keep rank for context if needed, but not used directly
}

interface Poll {
  name?: string;
  ranks?: RankEntry[];
}

interface EspnRankingsResponse {
  rankings?: Poll[];
}

// Interface for the data needed to process one logo
interface TeamLogoInfo {
    teamId: string; // Supabase UUID
    slug: string;   // URL-friendly slug derived from team data
    logoSrc: string; // Original logo URL from ESPN
}

// Interface for the matched Supabase team data needed
interface SupabaseTeam {
    id: string; // Supabase UUID
    abbreviation?: string;
    name?: string;
}
// --- End Type Definitions ---

// --- Environment & Supabase Client Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Path relative to packages/api/scrapers/runners/
const envPath = resolve(__dirname, '../../../../.env');
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const RANKINGS_URL =
  'https://site.api.espn.com/apis/site/v2/sports/lacrosse/mens-college-lacrosse/rankings?seasontype=2';
const STORAGE_BUCKET = 'team-logos';
// --- End Setup ---


// --- Main Logo Population Function ---
async function populateLogos() {
  console.log('Starting logo population process...');
  let processedCount = 0;
  let errorCount = 0;
  const teamsToProcess: TeamLogoInfo[] = [];
  const processedEspnIds = new Set<string>(); // Track processed ESPN IDs
  const skipped: string[] = []; // Track skipped ESPN IDs (no match)

  try {
    // 1. Fetch ESPN Data
    console.log('Fetching ESPN rankings data...');
    const response = await fetch(RANKINGS_URL, { headers: { 'User-Agent': 'LaxBot/LogoPopulate/1.0' } });
    if (!response.ok) {
        throw new Error(`ESPN rankings fetch failed: ${response.status}`);
    }
    const data = await response.json() as EspnRankingsResponse;
    const polls = data.rankings || [];

    if (!polls.length) {
        console.log('No ranking polls found in ESPN data.');
        return; // Exit if no polls
    }

    console.log(`Found ${polls.length} polls. Preparing team list...`);

    // 2. Loop through polls/ranks to find teams and logos
    for (const poll of polls) {
        const list = poll.ranks || [];
        for (const entry of list) {
            const espnId = String(entry.team.id);
            if (processedEspnIds.has(espnId)) continue; // Skip if ESPN ID already seen

            processedEspnIds.add(espnId); // Mark as seen

            let team: SupabaseTeam | null = null;

            // --- Team Matching Logic (Simplified - adapt if needed) ---
             try {
              // Fetch necessary fields for slug generation
              const { data: t, error: matchError } = await supabase
                .from('teams')
                .select('id, abbreviation, name')
                .eq('espn_id', espnId)
                .maybeSingle();

              if (matchError) {
                 console.warn(`Error matching ESPN ID ${espnId}: ${matchError.message}`);
              } else if (t) {
                 team = t;
              }
             } catch(matchCatchError: any) {
                 console.error(`Exception during matching for ESPN ID ${espnId}:`, matchCatchError);
             }
            // Add more matching strategies here if needed, similar to runRankings

            if (!team) {
                skipped.push(espnId); // Track skipped teams
                continue; // Skip if no match found
            }
            // --- End Team Matching ---

            // Get logo source and generate slug
            const logoSrc = entry.team.logos?.[0]?.href;
            if (logoSrc) {
                const slugBase = team.abbreviation || team.name || team.id; // Fallback to UUID if no name/abbr
                const slug = slugBase.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                teamsToProcess.push({
                    teamId: team.id, // Supabase UUID
                    slug: slug,
                    logoSrc: logoSrc
                });
            } else {
                 console.warn(` -> No logo found in ESPN data for matched team ${team.id} (ESPN: ${espnId})`);
            }
        }
    } // End poll/rank loop

    console.log(`Prepared ${teamsToProcess.length} teams with logos for processing.`);
    if (skipped.length > 0) {
        console.log(`Skipped ${skipped.length} teams (no match found): ${skipped.join(', ')}`);
    }

    // 3. Process each found team logo
    for (const teamInfo of teamsToProcess) {
      console.log(`Processing logo for team: ${teamInfo.slug} (ID: ${teamInfo.teamId})`);
      try {
          // 3a. Download image
          const imgResponse = await fetch(teamInfo.logoSrc);
          if (!imgResponse.ok) {
              throw new Error(`Download failed: ${imgResponse.status} ${imgResponse.statusText}`);
          }
          const buffer = await imgResponse.arrayBuffer();
          const contentType = imgResponse.headers.get('content-type') || 'application/octet-stream';

          // 3b. Determine extension and storage path
          const parsedUrl = new URL(teamInfo.logoSrc);
          const originalExt = extname(parsedUrl.pathname);
          const fileExtension = originalExt || '.png'; // Default extension
          const storagePath = `${teamInfo.slug}/${teamInfo.slug}${fileExtension}`;

          // 3c. Upload to Supabase Storage (Upsert)
          console.log(` -> Uploading to ${storagePath}...`);
          const { data: uploadData, error: uploadError } = await supabase.storage
              .from(STORAGE_BUCKET)
              .upload(storagePath, buffer, { contentType: contentType, upsert: true });

          if (uploadError) throw uploadError;
          if (!uploadData) throw new Error(`Storage upload failed, no data returned.`);

          // 3d. Get Public URL
          console.log(` -> Getting public URL...`);
          const { data: publicUrlData } = supabase.storage
              .from(STORAGE_BUCKET)
              .getPublicUrl(storagePath);

          if (!publicUrlData?.publicUrl) {
              throw new Error(`Failed to get public URL for ${storagePath}`);
          }
          const publicURL = publicUrlData.publicUrl;
          console.log(` -> Public URL: ${publicURL}`);

          // 3e. Upsert into team_logos table
          console.log(` -> Upserting to team_logos table...`);
          const { error: upsertError } = await supabase
              .from('team_logos') // TARGET TABLE
              .upsert({
                  team_id: teamInfo.teamId,
                  source_url: teamInfo.logoSrc,
                  storage_path: publicURL, // Storing the public URL here
                  is_primary: true
              }, {
                  onConflict: 'team_id' // Assumes you want to update if team_id exists
              });

          if (upsertError) throw upsertError;

          processedCount++;
          console.log(` -> Successfully processed ${teamInfo.slug}`);

      } catch (err: any) {
          errorCount++;
          console.error(` -> Error processing logo for team ${teamInfo.slug} (Logo URL: ${teamInfo.logoSrc}): ${err.message}`);
      }
    } // End logo processing loop

  } catch (err: any) {
      console.error(`Fatal error during script execution: ${err.message}`);
      errorCount++; // Count the fatal error
  } finally {
      console.log(`\nLogo Population Complete.`);
      console.log(`  Successfully processed: ${processedCount}`);
      console.log(`  Errors encountered:     ${errorCount}`);
  }
}

// --- Run the script ---
populateLogos(); 