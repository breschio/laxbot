import fetch from 'node-fetch';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve, extname } from 'path';
import { URL } from 'url'; // To handle URL parsing for extension

// --- Type Definitions ---
// Reuse types from runRankings if possible, or redefine needed ones
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
  current: number;
}

interface Poll {
  name?: string;
  ranks?: RankEntry[];
}

interface EspnRankingsResponse {
  rankings?: Poll[];
}

interface TeamInfo {
    teamId: string; // Supabase UUID
    slug: string;   // URL-friendly slug
    logoSrc: string; // Original logo URL
}

interface SupabaseTeam {
    id: string; // Supabase UUID
    abbreviation?: string;
    name?: string;
}
// --- End Type Definitions ---


// --- Environment & Supabase Client Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Adjust path relative to the new script location (packages/api/scripts)
const envPath = resolve(__dirname, '../../../.env');
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


// --- Function to scrape team data and match ---
async function scrapeTeamsFromRankings(client: SupabaseClient): Promise<TeamInfo[]> {
    console.log('Fetching ESPN rankings to find teams and logos...');
    const response = await fetch(RANKINGS_URL, { headers: { 'User-Agent': 'LaxBot/LogoPopulate/1.0' } });
    if (!response.ok) {
        throw new Error(`ESPN rankings fetch failed: ${response.status}`);
    }

    const data = await response.json() as EspnRankingsResponse;
    const polls = data.rankings || [];
    const teamsToProcess: TeamInfo[] = [];
    const processedEspnIds = new Set<string>(); // Avoid processing same ESPN team multiple times if in multiple polls

    for (const poll of polls) {
        const list = poll.ranks || [];
        console.log(`Processing poll: "${poll.name || 'Unknown'}" with ${list.length} teams...`);

        for (const entry of list) {
            const espnId = String(entry.team.id);
            if (processedEspnIds.has(espnId)) continue; // Skip if already processed

            let team: SupabaseTeam | null = null;

            // Simplified Matching (adapt from runRankings if needed)
            try {
              const { data: t, error } = await client
                .from('teams')
                .select('id, abbreviation, name') // Select fields needed for slug
                .eq('espn_id', espnId)
                .maybeSingle();
              if (!error && t) team = t;
            } catch (e) { console.error(`Error matching team ${espnId}:`, e)}

            if (team) {
                const logoSrc = entry.team.logos?.[0]?.href; // Get first logo URL
                if (logoSrc) {
                    // Generate slug (prefer abbreviation, fallback to name)
                    const slugBase = team.abbreviation || team.name || espnId;
                    const slug = slugBase.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

                    teamsToProcess.push({
                        teamId: team.id, // Supabase UUID
                        slug: slug,
                        logoSrc: logoSrc
                    });
                    processedEspnIds.add(espnId);
                }
            }
        }
    }
    console.log(`Found ${teamsToProcess.length} teams with logos to process.`);
    return teamsToProcess;
}

// --- Main Population Logic ---
async function populateLogos() {
    console.log('Starting logo population process...');
    let processedCount = 0;
    let errorCount = 0;

    try {
        const teams = await scrapeTeamsFromRankings(supabase);

        for (const team of teams) {
            console.log(`Processing team: ${team.slug} (ID: ${team.teamId})`);
            try {
                // 1. Download image
                const response = await fetch(team.logoSrc);
                if (!response.ok) {
                    throw new Error(`Failed to download logo: ${response.status} ${response.statusText}`);
                }
                const buffer = await response.arrayBuffer(); // Use arrayBuffer for binary data
                const contentType = response.headers.get('content-type') || 'application/octet-stream'; // Get content type

                // 2. Determine extension and storage path
                 // Parse URL to handle potential query params
                const parsedUrl = new URL(team.logoSrc);
                const originalExt = extname(parsedUrl.pathname); // Get extension from pathname
                const fileExtension = originalExt || '.png'; // Default to .png if no extension found
                const storagePath = `${team.slug}/${team.slug}${fileExtension}`;

                // 3. Upload to Supabase Storage (Upsert)
                console.log(` -> Uploading to ${storagePath}...`);
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from(STORAGE_BUCKET)
                    .upload(storagePath, buffer, {
                        contentType: contentType,
                        upsert: true, // Create or replace file
                    });

                if (uploadError) {
                    throw new Error(`Storage upload error: ${uploadError.message}`);
                }
                if (!uploadData) {
                     throw new Error(`Storage upload failed, no data returned.`);
                }

                // 4. Get Public URL
                 console.log(` -> Getting public URL...`);
                const { data: publicUrlData } = supabase.storage
                    .from(STORAGE_BUCKET)
                    .getPublicUrl(storagePath); // Use the exact path we uploaded to

                if (!publicUrlData || !publicUrlData.publicUrl) {
                     throw new Error(`Failed to get public URL for ${storagePath}`);
                }
                 const publicURL = publicUrlData.publicUrl;
                 console.log(` -> Public URL: ${publicURL}`);

                // 5. Upsert into team_logos table
                console.log(` -> Upserting to team_logos table...`);
                const { error: upsertError } = await supabase
                    .from('team_logos')
                    .upsert({
                        team_id: team.teamId,
                        source_url: team.logoSrc,
                        storage_path: publicURL, // Store the public URL
                        is_primary: true
                    }, {
                        onConflict: 'team_id' // Assume upsert based on team_id is desired
                        // If you want only one primary logo, you might need a more complex
                        // onConflict strategy or handle setting is_primary separately.
                    });

                if (upsertError) {
                    throw new Error(`DB upsert error: ${upsertError.message}`);
                }

                processedCount++;
                console.log(` -> Successfully processed ${team.slug}`);

            } catch (err: any) {
                errorCount++;
                console.error(` -> Error processing team ${team.slug} (Logo: ${team.logoSrc}): ${err.message}`);
                // Optional: Continue to next team on error
            }
        }

    } catch (err: any) {
        console.error(`Fatal error during logo population: ${err.message}`);
        errorCount++; // Count the fatal error
    } finally {
        console.log(`\nLogo Population Complete.`);
        console.log(`  Successfully processed: ${processedCount}`);
        console.log(`  Errors encountered:     ${errorCount}`);
    }
}

// --- Run the script ---
populateLogos(); 