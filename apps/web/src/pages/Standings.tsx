import React from 'react'
import { useStagedNcaaRpi } from '@/hooks/useStagedNcaaRpi'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function StandingsPage() {
  const { data: standings, isLoading, isError, error } = useStagedNcaaRpi()

  // Log the fetched data when available
  React.useEffect(() => {
    if (standings) {
      console.log("Staging RPI data received by component:", standings);
    }
  }, [standings]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>NCAA RPI Standings (Staging)</CardTitle>
        </CardHeader>
        <CardContent>
          <div>Loading standings...</div>
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>NCAA RPI Standings (Staging)</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Error Loading Standings</AlertTitle>
            <AlertDescription>
              {error?.message || 'An unknown error occurred.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>NCAA RPI Standings (Staging)</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Conference</TableHead>
              <TableHead>Record</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings && standings.map(row => {
              return (
                <TableRow key={row.rank}>
                  <TableCell>{row.rank}</TableCell>
                  <TableCell>{row.school_name}</TableCell>
                  <TableCell>{row.conference}</TableCell>
                  <TableCell>{row.record}</TableCell>
                </TableRow>
              );
            })}
            {standings && standings.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center">No RPI standings available in staging table.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
