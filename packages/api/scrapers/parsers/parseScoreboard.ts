import { db } from '@laxbot/db';
import { stgScoreboard, records, teams } from '@laxbot/db/schema';
import { and, eq } from 'drizzle-orm';
import { ESPNScoreboard, ESPNTeam } from './types';

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

  return record;
}

async function processTeam(team: ESPNTeam): Promise<void> {
  const abbreviation = team.team.abbreviation;
  
  // Find matching team in our database
  const match = await db
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.abbreviation, abbreviation))
    .limit(1);

  if (match.length === 0) {
    console.warn(`[ScoreboardParser] No matching team found for abbreviation: ${abbreviation}`);
    return;
  }

  const teamId = match[0].id;
  const record = parseTeamRecord(team);
  const currentYear = new Date().getFullYear();

  // Upsert record
  await db
    .insert(records)
    .values({
      team_id: teamId,
      season_year: currentYear,
      overall_wins: record.overallWins,
      overall_losses: record.overallLosses,
      conference_wins: record.conferenceWins,
      conference_losses: record.conferenceLosses,
      updated_at: new Date()
    })
    .onConflictDoUpdate({
      target: [records.team_id, records.season_year],
      set: {
        overall_wins: record.overallWins,
        overall_losses: record.overallLosses,
        conference_wins: record.conferenceWins,
        conference_losses: record.conferenceLosses,
        updated_at: new Date()
      }
    });

  console.log(`[ScoreboardParser] Updated records for team: ${abbreviation}`);
}

export async function parseScoreboard(): Promise<void> {
  console.log('[ScoreboardParser] Starting parse...');
  console.log('[ScoreboardParser] Checking database connection...');

  try {
    // Test query to check connection
    const teams = await db.query.teams.findFirst();
    console.log('[ScoreboardParser] Database connection successful!');
    console.log('[ScoreboardParser] Sample team:', teams ? teams.name : 'No teams found');
  } catch (error) {
    console.error('[ScoreboardParser] Database connection error:', error);
    // We'll continue anyway to see where else it might fail
  }

  try {
    console.log('[ScoreboardParser] Attempting to query stgScoreboard table...');
    // Get all unparsed scoreboard entries
    const stagingRows = await db
      .select()
      .from(stgScoreboard)
      .where(eq(stgScoreboard.source_id, 'espn-scoreboard'));

    console.log(`[ScoreboardParser] Found ${stagingRows.length} staging rows to process`);

    if (stagingRows.length === 0) {
      console.log('[ScoreboardParser] No staging data found. Have you run the scraper yet?');
      return;
    }

    for (const row of stagingRows) {
      try {
        const payload = row.raw_payload as ESPNScoreboard;
        console.log(`[ScoreboardParser] Processing row ID: ${row.id}, scraped at: ${row.scraped_at}`);

        // Process each event
        for (const event of payload.events) {
          console.log(`[ScoreboardParser] Processing event: ${event.id} - ${event.name}`);
          for (const competition of event.competitions) {
            console.log(`[ScoreboardParser] Competition: ${competition.id}, teams: ${competition.competitors.length}`);
            // Process each team in the competition
            await Promise.all(competition.competitors.map(processTeam));
          }
        }

        // Mark row as processed by deleting it
        await db
          .delete(stgScoreboard)
          .where(eq(stgScoreboard.id, row.id));

        console.log(`[ScoreboardParser] Successfully processed and deleted staging row: ${row.id}`);
      } catch (error) {
        console.error(`[ScoreboardParser] Error processing row ${row.id}:`, error);
      }
    }

    console.log('[ScoreboardParser] Completed parsing scoreboard data');
  } catch (error) {
    console.error('[ScoreboardParser] Error querying staging table:', error);
  }
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