import React from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Define types for the game and teams
interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logo?: string;
  record?: string;
  score?: number;
  isHome: boolean;
  logoUrl?: string;
}

interface GameCardProps {
  id: string;
  status: "scheduled" | "inProgress" | "final" | "postponed";
  gameDate: string;
  teams: Team[];
  venue?: string;
}

export function GameCard({ id, status, gameDate, teams, venue }: GameCardProps) {
  const homeTeam = teams.find(team => team.isHome) || teams[0];
  const awayTeam = teams.find(team => !team.isHome) || teams[1];
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  };
  
  const getStatusBadge = () => {
    switch(status) {
      case "inProgress":
        return <Badge className="bg-green-500 hover:bg-green-600">Live</Badge>;
      case "final":
        return <Badge variant="secondary">Final</Badge>;
      case "postponed":
        return <Badge variant="destructive">Postponed</Badge>;
      default:
        return <Badge variant="outline">{formatDate(gameDate)}</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <div className="text-sm font-medium">
          {status === "scheduled" ? "Upcoming" : status === "inProgress" ? "Live" : "Completed"}
        </div>
        {getStatusBadge()}
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-3 gap-4 p-4">
          {/* Away Team */}
          <div className="flex flex-col items-center justify-center">
            {awayTeam.logoUrl ? (
              <div className="w-12 h-12 mb-2">
                <img 
                  src={awayTeam.logoUrl} 
                  alt={`${awayTeam.name} logo`}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-12 h-12 mb-2 bg-gray-200 dark:bg-gray-850 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">{awayTeam.abbreviation}</span>
              </div>
            )}
            <span className="text-sm font-medium">{awayTeam.abbreviation}</span>
            {status !== "scheduled" && (
              <span className="text-2xl font-bold mt-1">{awayTeam.score || 0}</span>
            )}
          </div>
          
          {/* Game Info */}
          <div className="flex flex-col items-center justify-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {status === "scheduled" && formatDate(gameDate)}
              {status === "inProgress" && "VS"}
              {status === "final" && "Final"}
              {status === "postponed" && "Postponed"}
            </span>
            {venue && (
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                {venue}
              </span>
            )}
          </div>
          
          {/* Home Team */}
          <div className="flex flex-col items-center justify-center">
            {homeTeam.logoUrl ? (
              <div className="w-12 h-12 mb-2">
                <img 
                  src={homeTeam.logoUrl} 
                  alt={`${homeTeam.name} logo`}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-12 h-12 mb-2 bg-gray-200 dark:bg-gray-850 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">{homeTeam.abbreviation}</span>
              </div>
            )}
            <span className="text-sm font-medium">{homeTeam.abbreviation}</span>
            {status !== "scheduled" && (
              <span className="text-2xl font-bold mt-1">{homeTeam.score || 0}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 