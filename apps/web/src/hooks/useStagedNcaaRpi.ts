import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Define the shape of the data from the staging table
interface StagedRpiData {
  rank: number;
  school_name: string;
  conference: string;
  record: string;
  scraped_at?: string; // Might be useful later
}

const fetchStagedNcaaRpi = async (): Promise<StagedRpiData[]> => {
  console.log('Fetching data from stg_ncaa_rpi...');
  const { data, error } = await supabase
    .from('stg_ncaa_rpi') // Fetch from the staging table
    .select('rank, school_name, conference, record, scraped_at') // Select relevant columns
    .order('rank', { ascending: true }); // Order by rank

  if (error) {
    console.error('Error fetching from stg_ncaa_rpi:', error);
    throw new Error(`Supabase error fetching stg_ncaa_rpi: ${error.message}`); 
  }

  if (!data) {
      console.log('No data returned from stg_ncaa_rpi.');
      return [];
  }
    
  console.log(`Fetched ${data.length} records from stg_ncaa_rpi.`);
  return data as StagedRpiData[]; 
};

export const useStagedNcaaRpi = () => {
  return useQuery<StagedRpiData[], Error>({ 
    queryKey: ['standings', 'stg_ncaa_rpi'], // Unique query key for this source
    queryFn: fetchStagedNcaaRpi,
  });
}; 