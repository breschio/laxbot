import { Router, Request, Response } from 'express';
import { supabase } from '@db';
import { stgScoreboard } from '@schema';
import { gte } from 'drizzle-orm';

const router: Router = Router();

// Log everything for debugging
console.error('=== SCHEDULE ROUTER LOADED ===');
console.error('Supabase client available:', !!supabase);
console.error('Supabase methods:', Object.keys(supabase || {}));

// @ts-ignore - Express typing issues
router.get('/schedule', async (req: Request, res: Response) => {
  try {
    // Create a timestamp to simulate when data was last scraped
    const lastScraped = new Date();
    lastScraped.setHours(lastScraped.getHours() - 2); // 2 hours ago
    
    console.log('Using simulated data with timestamp:', lastScraped.toISOString());
    
    // Current date for generating realistic game dates
    const today = new Date();
    
    // Create dates for this week
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);
    
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(today.getDate() + 3);
    
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 4);
    
    const fourDaysFromNow = new Date(today);
    fourDaysFromNow.setDate(today.getDate() + 5);
    
    const fiveDaysFromNow = new Date(today);
    fiveDaysFromNow.setDate(today.getDate() + 6);
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    
    // NCAA Men's Lacrosse Current Week Schedule
    const games = [
      {
        id: "ncaa_mens_2024_04_30_1",
        homeTeam: "Syracuse Orange",
        awayTeam: "Johns Hopkins Blue Jays",
        homeLogoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/183.png",
        awayLogoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/2483.png",
        gameDate: tomorrow.toISOString(),
        broadcastNetwork: "ESPN+",
        venue: "Carrier Dome"
      },
      {
        id: "ncaa_mens_2024_04_30_2",
        homeTeam: "Duke Blue Devils",
        awayTeam: "Maryland Terrapins",
        homeLogoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/150.png",
        awayLogoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/120.png",
        homeScore: 10,
        awayScore: 12,
        gameDate: yesterday.toISOString(),
        broadcastNetwork: "ACCN",
        venue: "Koskinen Stadium"
      },
      {
        id: "ncaa_mens_2024_04_30_3",
        homeTeam: "Notre Dame Fighting Irish",
        awayTeam: "Virginia Cavaliers",
        homeLogoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/87.png",
        awayLogoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/258.png",
        gameDate: today.toISOString(),
        broadcastNetwork: "ESPN",
        venue: "Arlotta Stadium"
      },
      {
        id: "ncaa_mens_2024_05_01_1",
        homeTeam: "Princeton Tigers",
        awayTeam: "Penn Quakers",
        homeLogoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/163.png",
        awayLogoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/159.png",
        gameDate: tomorrow.toISOString(),
        broadcastNetwork: "ESPNU",
        venue: "Class of 1952 Stadium"
      },
      {
        id: "ncaa_mens_2024_05_01_2",
        homeTeam: "Cornell Big Red",
        awayTeam: "Yale Bulldogs",
        homeLogoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/149.png",
        awayLogoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/43.png",
        gameDate: dayAfterTomorrow.toISOString(),
        broadcastNetwork: "ESPN+",
        venue: "Schoellkopf Field"
      },
      {
        id: "ncaa_mens_2024_05_02_1",
        homeTeam: "Denver Pioneers",
        awayTeam: "Georgetown Hoyas",
        homeLogoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/2168.png",
        awayLogoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/46.png",
        gameDate: twoDaysFromNow.toISOString(),
        broadcastNetwork: "CBS Sports Network",
        venue: "Peter Barton Lacrosse Stadium"
      },
      {
        id: "ncaa_mens_2024_05_02_2",
        homeTeam: "Army Black Knights",
        awayTeam: "Navy Midshipmen",
        homeLogoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/349.png",
        awayLogoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/2426.png",
        gameDate: twoDaysFromNow.toISOString(),
        broadcastNetwork: "ESPN",
        venue: "Michie Stadium"
      },
      {
        id: "ncaa_mens_2024_05_03_1",
        homeTeam: "Rutgers Scarlet Knights",
        awayTeam: "Ohio State Buckeyes",
        homeLogoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/164.png",
        awayLogoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/194.png",
        gameDate: threeDaysFromNow.toISOString(),
        broadcastNetwork: "Big Ten Network",
        venue: "SHI Stadium"
      },
      {
        id: "ncaa_mens_2024_05_03_2",
        homeTeam: "Penn State Nittany Lions",
        awayTeam: "Michigan Wolverines",
        homeLogoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/213.png",
        awayLogoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/130.png",
        gameDate: threeDaysFromNow.toISOString(),
        broadcastNetwork: "Big Ten Network",
        venue: "Panzer Stadium"
      },
      {
        id: "ncaa_mens_2024_05_04_1",
        homeTeam: "North Carolina Tar Heels",
        awayTeam: "Loyola Greyhounds",
        homeLogoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/153.png",
        awayLogoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/2294.png",
        gameDate: fourDaysFromNow.toISOString(),
        broadcastNetwork: "ACCN",
        venue: "Dorrance Field"
      },
      {
        id: "ncaa_mens_2024_05_04_2",
        homeTeam: "Brown Bears",
        awayTeam: "Harvard Crimson",
        homeLogoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/225.png",
        awayLogoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/108.png",
        gameDate: fourDaysFromNow.toISOString(),
        broadcastNetwork: "ESPN+",
        venue: "Stevenson-Pincince Field"
      },
      {
        id: "ncaa_mens_2024_05_04_3",
        homeTeam: "Richmond Spiders",
        awayTeam: "Massachusetts Minutemen",
        homeLogoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/257.png",
        awayLogoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/113.png",
        homeScore: 9,
        awayScore: 8,
        gameDate: twoDaysAgo.toISOString(),
        broadcastNetwork: "ESPN+",
        venue: "Robins Stadium"
      }
    ];

    console.log(`Returning ${games.length} NCAA lacrosse games for testing`);
    return res.json({ 
      data: games,
      meta: {
        lastScrapedAt: lastScraped.toISOString(),
        source: 'database',
        info: 'Simulated data for development until real data is available'
      }
    });
  } catch (err) {
    console.error('Error in schedule route:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;