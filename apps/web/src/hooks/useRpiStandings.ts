import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Updated interface for selected columns
interface RpiStandingWithLogo {
  team_id: string; // Needed for key
  rank: number;
  team_name: string;
  team_logo_url: string; // Added specifically
  poll_name: string; // Needed for filter
}

const fetchNcaaRpiStandings = async (): Promise<RpiStandingWithLogo[]> => {
  console.log("Fetching NCAA RPI rankings from rankings_full...");
  const targetPollName = "NCAA RPI";
  
  const { data, error } = await supabase
    .from('rankings_full') 
    .select('team_id, rank, team_name, team_logo_url, poll_name') 
    .eq('poll_name', targetPollName)
    .order('rank', { ascending: true });

  if (error) {
    console.error(`Error fetching "${targetPollName}" rankings_full:`, error);
    throw new Error(`Supabase error fetching rankings_full: ${error.message}`);
  }

  if (!data) {
    console.log(`No data returned from rankings_full for poll "${targetPollName}".`);
    return [];
  }

  console.log(`Fetched ${data.length} "${targetPollName}" rankings from rankings_full.`);
  
  // Log sample logo URLs again for this specific poll
  if (data && data.length > 0) {
      console.log("Sample Logo URLs (NCAA RPI Poll):", data.slice(0, 5).map(item => ({ team: item.team_name, logoUrl: item.team_logo_url })));
  }
  
  return data as RpiStandingWithLogo[]; 
};

export const useRpiStandings = () => {
  return useQuery<RpiStandingWithLogo[], Error>({ 
    queryKey: ['rankings_full', 'poll', "NCAA RPI"],
    queryFn: fetchNcaaRpiStandings,
  });
}; 