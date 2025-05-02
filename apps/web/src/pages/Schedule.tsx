import React, { FC, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GameCard } from '@/components/GameCard';
import { supabase } from '@/lib/supabase';

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logoUrl?: string;
  score?: number;
  isHome: boolean;
}

// This is the shape of data coming from the API
interface ApiGameData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogoUrl: string;
  awayLogoUrl: string;
  homeScore?: number;
  awayScore?: number;
  gameDate: string;
  broadcastNetwork?: string;
  venue?: string;
}

// API response with metadata
interface ApiResponse {
  data: ApiGameData[];
  meta?: {
    lastScrapedAt?: string;
    source: 'database' | 'mock';
    reason?: string;
  };
}

// Supabase data shape
interface SupabaseScoreboardEntry {
  id: string;
  source_id: string;
  raw_payload: {
    homeTeam: string;
    awayTeam: string;
    homeLogoUrl: string;
    awayLogoUrl: string;
    homeScore?: number;
    awayScore?: number;
    gameDate: string;
    broadcastNetwork?: string;
    venue?: string;
  };
  scraped_at: string;
  created_at: string;
}

// This is what the GameCard component expects
interface GameData {
  id: string;
  status: "scheduled" | "inProgress" | "final" | "postponed";
  gameDate: string;
  teams: Team[];
  venue?: string;
}

// Transform Supabase data to component data
const transformSupabaseData = (entries: SupabaseScoreboardEntry[]): GameData[] => {
  return entries.map(entry => {
    const gameData = entry.raw_payload;
    
    // Determine game status based on presence of scores and game date
    let status: "scheduled" | "inProgress" | "final" | "postponed" = "scheduled";
    const gameDate = new Date(gameData.gameDate);
    const now = new Date();
    
    if (gameData.homeScore !== undefined && gameData.awayScore !== undefined) {
      // If we have scores, the game is either in progress or final
      const sixHoursAgo = new Date(now);
      sixHoursAgo.setHours(now.getHours() - 6);
      
      if (gameDate < sixHoursAgo) {
        status = "final";
      } else {
        status = "inProgress";
      }
    } else if (gameDate < now) {
      // If the game date is in the past but we have no scores, mark as postponed
      status = "postponed";
    }

    return {
      id: entry.id,
      status,
      gameDate: gameData.gameDate,
      teams: [
        {
          id: `home-${entry.id}`,
          name: gameData.homeTeam,
          abbreviation: gameData.homeTeam.substring(0, 3).toUpperCase(),
          logoUrl: gameData.homeLogoUrl,
          score: gameData.homeScore,
          isHome: true
        },
        {
          id: `away-${entry.id}`,
          name: gameData.awayTeam,
          abbreviation: gameData.awayTeam.substring(0, 3).toUpperCase(),
          logoUrl: gameData.awayLogoUrl,
          score: gameData.awayScore,
          isHome: false
        }
      ],
      venue: gameData.venue
    };
  });
};

// Mock data for development (only used as fallback)
const mockGames: GameData[] = [
  {
    id: "game1",
    status: "scheduled",
    gameDate: new Date(Date.now() + 86400000).toISOString(), // tomorrow
    teams: [
      {
        id: "team1",
        name: "Syracuse Orange",
        abbreviation: "SYR",
        logoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/183.png",
        isHome: true
      },
      {
        id: "team2",
        name: "Johns Hopkins Blue Jays",
        abbreviation: "JHU",
        logoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/2483.png",
        isHome: false
      }
    ],
    venue: "Carrier Dome"
  },
  {
    id: "game2",
    status: "final",
    gameDate: new Date(Date.now() - 86400000).toISOString(), // yesterday
    teams: [
      {
        id: "team3",
        name: "Maryland Terrapins",
        abbreviation: "MD",
        logoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/120.png",
        score: 12,
        isHome: false
      },
      {
        id: "team4",
        name: "Duke Blue Devils",
        abbreviation: "DUKE",
        logoUrl: "https://a.espncdn.com/i/teamlogos/ncaa/500/150.png",
        score: 10,
        isHome: true
      }
    ],
    venue: "Koskinen Stadium"
  }
];

const SchedulePage: FC = () => {
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'database' | 'mock' | null>(null);
  const [errorReason, setErrorReason] = useState<string | null>(null);

  // Use Supabase to fetch data directly
  const { data: gameEntries, isLoading, isError, error } = useQuery({
    queryKey: ['schedule'],
    queryFn: async () => {
      try {
        console.log('Fetching schedule from Supabase...');
        
        // Try to get data from Supabase directly
        const { data: scoreboardData, error: supabaseError } = await supabase
          .from('stg_scoreboard')
          .select('*')
          .order('created_at', { ascending: false });
        
        // If we got an error from Supabase
        if (supabaseError) {
          console.error('Supabase error:', supabaseError);
          throw new Error(`Supabase error: ${supabaseError.message}`);
        }
        
        // If we got data from Supabase
        if (scoreboardData && scoreboardData.length > 0) {
          console.log('Found data in Supabase:', scoreboardData.length, 'entries');
          
          // Find the most recent scrape time
          let latestScrapeTime = new Date(0); // Start with oldest possible date
          
          scoreboardData.forEach(entry => {
            const entryDate = new Date(entry.scraped_at);
            if (entryDate > latestScrapeTime) {
              latestScrapeTime = entryDate;
            }
          });
          
          // Return the data and metadata
          return { 
            entries: scoreboardData as SupabaseScoreboardEntry[],
            lastScraped: latestScrapeTime.toISOString(),
            source: 'database' as const
          };
        }
        
        // If we didn't get any data from Supabase, fall back to the API
        console.log('No data found in Supabase, falling back to API');
        
        const response = await fetch('/api/schedule');
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const apiResponse = await response.json() as ApiResponse;
        
        return {
          // Convert API format to Supabase format for consistent handling
          entries: apiResponse.data.map(game => ({
            id: game.id,
            source_id: game.id,
            raw_payload: game,
            scraped_at: apiResponse.meta?.lastScrapedAt || new Date().toISOString(),
            created_at: apiResponse.meta?.lastScrapedAt || new Date().toISOString()
          })),
          lastScraped: apiResponse.meta?.lastScrapedAt || new Date().toISOString(),
          source: apiResponse.meta?.source || 'mock'
        };
        
      } catch (err) {
        console.error('Error fetching schedule data:', err);
        console.info('Using mock data instead');
        
        // Return mock data as fallback
        return { 
          entries: mockGames.map(game => ({
            id: game.id,
            source_id: game.id,
            raw_payload: {
              homeTeam: game.teams.find(t => t.isHome)?.name || '',
              awayTeam: game.teams.find(t => !t.isHome)?.name || '',
              homeLogoUrl: game.teams.find(t => t.isHome)?.logoUrl || '',
              awayLogoUrl: game.teams.find(t => !t.isHome)?.logoUrl || '',
              homeScore: game.teams.find(t => t.isHome)?.score,
              awayScore: game.teams.find(t => !t.isHome)?.score,
              gameDate: game.gameDate,
              venue: game.venue
            },
            scraped_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          })),
          lastScraped: new Date().toISOString(),
          source: 'mock' as const,
          reason: String(err)
        };
      }
    },
    // Refresh data every 5 minutes and when the window regains focus
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
    retryDelay: 1000
  });

  // Update state when data changes
  useEffect(() => {
    if (gameEntries) {
      setDataSource(gameEntries.source);
      setErrorReason(gameEntries.reason || null);
      
      if (gameEntries.lastScraped) {
        try {
          const date = new Date(gameEntries.lastScraped);
          setLastUpdate(date.toLocaleString());
        } catch (err) {
          console.error('Error parsing date:', err);
          setLastUpdate(gameEntries.lastScraped);
        }
      } else {
        setLastUpdate(null);
      }
    }
  }, [gameEntries]);

  // Transform the data for the GameCard component
  const games = gameEntries?.entries && gameEntries.entries.length > 0
    ? transformSupabaseData(gameEntries.entries)
    : mockGames;

  // If loading, show a loading indicator
  if (isLoading) {
    return <div className="flex justify-center items-center h-[60vh]">Loading schedule...</div>;
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Lacrosse Schedule</h1>
      
      {/* Data Source Indicator */}
      {dataSource === 'mock' && (
        <div className="mb-6 p-3 bg-yellow-100 text-yellow-800 rounded">
          <p className="font-semibold">Using Mock Data</p>
          <p className="text-sm mt-1">
            {errorReason || "The schedule data shown is sample data for development purposes only."}
          </p>
        </div>
      )}
      
      {dataSource === 'database' && lastUpdate && (
        <div className="mb-6 p-2 bg-green-100 text-green-800 rounded text-sm">
          <p className="font-medium">Live Data</p>
          <p>Last data update: {lastUpdate}</p>
        </div>
      )}
      
      {/* Game Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {games.map(game => (
          <GameCard key={game.id} {...game} />
        ))}
      </div>
    </>
  );
};

export default SchedulePage; 