import React, { useState, useEffect } from 'react';
import { 
    Table, 
    TableHeader, 
    TableBody, 
    TableRow, 
    TableHead, 
    TableCell 
} from "@/components/ui/table"; // Assuming shadcn table is here
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"; // Using ToggleGroup for filters
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton"; // For loading state

// Match API response structure
interface StandingsEntry {
  rank: number | null;
  team_id?: string; 
  team_name: string | null;
  record1: string | null; 
  record2: string | null; 
}

interface ApiResponse {
  data: StandingsEntry[];
  error?: string;
}

const FILTERS = [
  'Top 20', 'ACC', 'Big Ten', 'Ivy League', 'Big East', 'Patriot League', 
  'CAA', 'America East', 'ASUN', 'NEC', 'Atlantic 10', 'All'
];

const getFilterParam = (filterLabel: string): string => {
  if (filterLabel === 'Top 20') return 'top-20';
  return filterLabel.toLowerCase().replace(/ /g, '-');
};

const StandingsPage: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>('Top 20');
  const [standingsData, setStandingsData] = useState<StandingsEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      const filterParam = getFilterParam(selectedFilter);
      try {
        const response = await fetch(`/api/standings?filter=${filterParam}`);
        if (!response.ok) {
          const errorData: ApiResponse = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const result: ApiResponse = await response.json();
        setStandingsData(result.data);
      } catch (err: any) {
        console.error("Failed to fetch standings:", err);
        setError(err.message || 'Failed to load data.');
        setStandingsData([]); // Clear data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedFilter]);

  const isConferenceFilter = selectedFilter !== 'Top 20' && selectedFilter !== 'All';

  const renderTableContent = () => {
    if (isLoading) {
      // Render Skeleton loaders
      return Array.from({ length: 10 }).map((_, index) => (
        <TableRow key={`skeleton-${index}`}>
          <TableCell><Skeleton className="h-4 w-8 rounded" /></TableCell>
          <TableCell><Skeleton className="h-4 w-48 rounded" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16 rounded" /></TableCell>
          {isConferenceFilter && (
            <TableCell><Skeleton className="h-4 w-16 rounded" /></TableCell>
          )}
        </TableRow>
      ));
    }

    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={isConferenceFilter ? 4 : 3} className="text-center text-destructive">
            Error loading data: {error}
          </TableCell>
        </TableRow>
      );
    }

    if (standingsData.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={isConferenceFilter ? 4 : 3} className="text-center text-muted-foreground">
            No standings data available for {selectedFilter}.
          </TableCell>
        </TableRow>
      );
    }

    return standingsData.map((item, index) => (
      <TableRow key={item.team_id || `${item.team_name}-${index}`}>
        <TableCell className="font-medium">{item.rank ? `#${item.rank}` : '-'}</TableCell>
        <TableCell>{item.team_name || 'N/A'}</TableCell>
        <TableCell>{item.record1 || '-'}</TableCell>
        {isConferenceFilter && (
           <TableCell>{item.record2 || '-'}</TableCell> // Overall Record for conferences
        )}
      </TableRow>
    ));
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
        {/* Mimic Header - Replace with actual shared Layout/Header if available */} 
        {/* Remove this placeholder header section as Layout is applied in App.tsx */}
        {/* <div className="flex justify-between items-center border-b pb-2 mb-4">
             <h1 className="text-2xl font-bold">Laxbot</h1>
             <nav className="flex space-x-4">
                 <a href="/schedule" className="text-muted-foreground hover:text-primary">Schedule</a>
                 <a href="/standings" className="text-primary font-medium">Standings</a>
             </nav>
        </div> */}
        {/* End Header Mimic */}

      <ToggleGroup 
        type="single" 
        value={selectedFilter} 
        onValueChange={(value) => {
            if (value) setSelectedFilter(value); // Prevent unselecting
        }}
        className="flex flex-wrap justify-center gap-2"
        aria-label="Standings Filter"
      >
        {FILTERS.map((filter) => (
          <ToggleGroupItem key={filter} value={filter} aria-label={`Filter by ${filter}`}>
            {filter}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Card>
        <CardHeader>
          <CardTitle>{selectedFilter} Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Rank</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="w-[120px]">{isConferenceFilter ? 'Conf Rec' : 'Record'}</TableHead>
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

export default StandingsPage; 