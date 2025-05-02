import React, { useState, useEffect } from 'react';
import { 
    Table, 
    TableHeader, 
    TableBody, 
    TableRow, 
    TableHead, 
    TableCell 
} from "@/components/ui/table"; // Fixed import path
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"; // Fixed import path
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; // Fixed import path
import { Skeleton } from "@/components/ui/skeleton"; // Fixed import path
import { supabase } from '@/lib/supabaseClient'; // Import Supabase client

// Consistent structure for the frontend table
interface StandingsEntry {
  rank: number | null;
  team_name: string | null;
  record1: string | null; // Overall Record (RPI) OR Conf Record (Conf)
  record2: string | null; // Null (RPI) OR Overall Record (Conf)
}

// Generic type for Supabase response, specific fields accessed conditionally
// We could use a union type, but checking properties might be simpler here.
interface GenericRankingResponse {
  // Common potential fields
  rank?: number | null;
  school_name?: string | null;
  record?: string | null;
  conference_rank?: number | null;
  team_name?: string | null;
  conference_record?: string | null;
  overall_record?: string | null;
  // Add other potential fields if needed, though not used for display
  [key: string]: any; // Allow other properties
}

const FILTERS = [
  'Top 20', 'ACC', 'Big Ten', 'Ivy League', 'Big East', 'Patriot League', 
  'CAA', 'America East', 'ASUN', 'NEC', 'Atlantic 10', 'All'
];

// Maps frontend filter labels to Supabase table names
const FILTER_TABLE_MAP: Record<string, string> = {
  'Top 20': 'stg_ncaa_rpi',
  'All': 'stg_ncaa_rpi',
  'ACC': 'stg_conf_acc',
  'Big Ten': 'stg_conf_big_ten',
  'Ivy League': 'stg_conf_ivy_league',
  'Big East': 'stg_conf_big_east',
  'Patriot League': 'stg_conf_patriot',
  'CAA': 'stg_conf_caa',
  'America East': 'stg_conf_america_east',
  'ASUN': 'stg_conf_asun',
  'NEC': 'stg_conf_nec',
  'Atlantic 10': 'stg_conf_atlantic_10',
};

const RankingsPage: React.FC = () => { 
  const [selectedFilter, setSelectedFilter] = useState<string>('Top 20');
  const [rankingsData, setRankingsData] = useState<StandingsEntry[]>([]); 
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Determine if the current filter uses a conference-specific table
  const isConferenceFilter = selectedFilter !== 'Top 20' && selectedFilter !== 'All';

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      const targetTable = FILTER_TABLE_MAP[selectedFilter];
      if (!targetTable) {
        setError(`Invalid filter selected: ${selectedFilter}`);
        setIsLoading(false);
        setRankingsData([]);
        return;
      }

      // Determine columns and ordering based on the table
      const isNcaaRpiTable = targetTable === 'stg_ncaa_rpi';
      const selectColumns = isNcaaRpiTable 
        ? 'rank, school_name, record' 
        : 'conference_rank, team_name, conference_record, overall_record';
      const orderByColumn = isNcaaRpiTable ? 'rank' : 'conference_rank';
      
      try {
        console.log(`Fetching from table: ${targetTable} for filter: ${selectedFilter}`); 

        let query = supabase
          .from(targetTable)
          .select(selectColumns)
          .order(orderByColumn, { ascending: true, nullsFirst: false });

        // Apply Top 20 filter specifically to the RPI table
        if (selectedFilter === 'Top 20' && isNcaaRpiTable) {
          query = query.lte('rank', 20).not('rank', 'is', null);
        }

        // Execute the query
        const { data, error: dbError } = await query;

        if (dbError) {
          console.error("Supabase error:", dbError);
          // Provide a more specific error if possible
          if (dbError.message.includes('relation') && dbError.message.includes('does not exist')) {
             throw new Error(`Table '${targetTable}' not found. Check Supabase schema.`);
          } else {
             throw new Error(dbError.message || 'Failed to fetch data from Supabase.');
          }
        }

        console.log('Supabase response data:', data); 

        // Transform data based on the source table
        const transformedData: StandingsEntry[] = data?.map((item: GenericRankingResponse) => {
          if (isNcaaRpiTable) {
            // Data from stg_ncaa_rpi
            return {
              rank: item.rank ?? null,
              team_name: item.school_name ?? 'N/A',
              record1: item.record ?? '-', // Overall Record
              record2: null, // No second record for RPI view
            };
          } else {
            // Data from stg_conf_*
            return {
              rank: item.conference_rank ?? null,
              team_name: item.team_name ?? 'N/A',
              record1: item.conference_record ?? '-', // Conference Record
              record2: item.overall_record ?? '-', // Overall Record
            };
          }
        }) || [];

        console.log('Transformed data:', transformedData);
        setRankingsData(transformedData);

      } catch (err: any) {
        console.error("Failed to fetch rankings:", err); 
        setError(err.message || 'Failed to load data.');
        setRankingsData([]); // Clear data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedFilter]);

  // isConferenceFilter is now derived directly from selectedFilter state, no need to recalculate

  const renderTableContent = () => {
    if (isLoading) {
      // Render Skeleton loaders (adjust count based on expected rows)
      return Array.from({ length: selectedFilter === 'Top 20' ? 20 : 10 }).map((_, index) => ( 
        <TableRow key={`skeleton-${index}`}>
          <TableCell><Skeleton className="h-4 w-8 rounded" /></TableCell>
          <TableCell><Skeleton className="h-4 w-48 rounded" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16 rounded" /></TableCell>
          {/* Show skeleton for 4th column only if it's a conference filter */}
          {isConferenceFilter && (
            <TableCell><Skeleton className="h-4 w-16 rounded" /></TableCell>
          )}
        </TableRow>
      ));
    }

    if (error) {
      return (
        <TableRow>
          {/* Adjust colspan based on whether the 4th column is expected */}
          <TableCell colSpan={isConferenceFilter ? 4 : 3} className="text-center text-destructive">
            Error loading data: {error}
          </TableCell>
        </TableRow>
      );
    }

    if (rankingsData.length === 0) { 
      return (
        <TableRow>
          <TableCell colSpan={isConferenceFilter ? 4 : 3} className="text-center text-muted-foreground">
            No rankings data available for {selectedFilter}.
          </TableCell>
        </TableRow>
      );
    }

    // Display the fetched and transformed data
    return rankingsData.map((item, index) => ( 
      <TableRow key={`${item.team_name}-${item.rank}-${index}`}> 
        <TableCell className="font-medium">{item.rank ? `#${item.rank}` : '-'}</TableCell>
        <TableCell>{item.team_name || 'N/A'}</TableCell>
        {/* record1 is Overall Record for RPI, Conf Record for conference */}
        <TableCell>{item.record1 || '-'}</TableCell> 
        {/* record2 is Overall Record, shown only for conference filter */}
        {isConferenceFilter && (
           <TableCell>{item.record2 || '-'}</TableCell> 
        )}
      </TableRow>
    ));
  };

  return (
    <div className="container mx-auto p-4 space-y-6">

      {/* Filter Selection Toggle Group */}
      <ToggleGroup 
        type="single" 
        value={selectedFilter} 
        onValueChange={(value) => {
            if (value) setSelectedFilter(value); 
        }}
        className="flex flex-wrap justify-center gap-2"
        aria-label="Rankings Filter" 
      >
        {FILTERS.map((filter) => (
          <ToggleGroupItem key={filter} value={filter} aria-label={`Filter by ${filter}`}>
            {filter}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {/* Rankings Card and Table */}
      <Card>
        <CardHeader>
          <CardTitle>{selectedFilter} Rankings</CardTitle> 
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Rank</TableHead>
                <TableHead>Team</TableHead>
                {/* Header for record1 depends on filter type */}
                <TableHead className="w-[120px]">{isConferenceFilter ? 'Conf Rec' : 'Record'}</TableHead>
                {/* Show Overall Record column header only for conference filters */}
                {isConferenceFilter && (
                  <TableHead className="w-[120px]">Overall Rec</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderTableContent()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// Updated export
export default RankingsPage; 