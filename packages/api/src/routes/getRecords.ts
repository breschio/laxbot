import { Router, Request, Response } from 'express';
import { db } from '@db';
import { records, teams } from '@schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';

// Define the query params interface
interface GetRecordsQuery {
  seasonYear?: string;
  page?: string;
  limit?: string;
  teamId?: string;
  minWins?: string;
  sort?: string;
}

// Define the response data interface
interface RecordResponse {
  teamId: string;
  name: string;
  abbreviation: string | null;
  overallWins: number;
  overallLosses: number;
  conferenceWins: number;
  conferenceLosses: number;
  winPercentage: number;
  updatedAt: string | Date;
}

interface PaginatedResponse {
  data: RecordResponse[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
  };
}

const router: Router = Router();

// @ts-ignore - Express typing issues
router.get('/records', async (req: Request<{}, {}, {}, GetRecordsQuery>, res: Response) => {
  try {
    const { seasonYear, page, limit, teamId, minWins, sort } = req.query;
    
    // Convert and validate query params with defaults
    const year = seasonYear ? parseInt(seasonYear, 10) : new Date().getFullYear();
    const currentPage = page ? parseInt(page, 10) : 1;
    const pageSize = limit ? parseInt(limit, 10) : 20;
    const minWinsFilter = minWins ? parseInt(minWins, 10) : undefined;
    
    // Validate query params
    if (isNaN(year) || isNaN(currentPage) || isNaN(pageSize) || (minWinsFilter !== undefined && isNaN(minWinsFilter))) {
      return res.status(400).json({ 
        error: 'Invalid query parameters',
        details: 'Numeric parameters must be valid numbers'
      });
    }

    if (currentPage < 1 || pageSize < 1 || pageSize > 100) {
      return res.status(400).json({ 
        error: 'Invalid pagination parameters',
        details: 'Page must be >= 1 and limit must be between 1 and 100'
      });
    }

    // Build query conditions
    const conditions = [eq(records.season_year, year)];
    
    if (teamId) {
      conditions.push(eq(records.team_id, teamId));
    }
    
    if (minWinsFilter !== undefined) {
      conditions.push(gte(records.overall_wins, minWinsFilter));
    }

    // Calculate pagination
    const offset = (currentPage - 1) * pageSize;

    // Determine sort order
    let orderBy = desc(records.overall_wins); // Default sort
    if (sort === 'winpct') {
      // Use SQL expression for win percentage sorting
      const winPctExpression = sql`CASE WHEN (${records.overall_wins} + ${records.overall_losses}) > 0 
                                   THEN ${records.overall_wins}::float / (${records.overall_wins} + ${records.overall_losses}) 
                                   ELSE 0 END`;
      orderBy = desc(winPctExpression);
    } else if (sort === 'name') {
      orderBy = sql`${teams.name} ASC`;
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(records)
      .where(and(...conditions));
    
    const totalRecords = countResult[0]?.count || 0;
    
    // Query records with team data
    const result = await db
      .select({
        teamId: records.team_id,
        name: teams.name,
        abbreviation: teams.abbreviation,
        overallWins: records.overall_wins,
        overallLosses: records.overall_losses,
        conferenceWins: records.conference_wins,
        conferenceLosses: records.conference_losses,
        updatedAt: records.updated_at
      })
      .from(records)
      .innerJoin(teams, eq(records.team_id, teams.id))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);
    
    // Transform result to add computed properties
    const transformedResults: RecordResponse[] = result.map((record) => {
      const totalGames = record.overallWins + record.overallLosses;
      const winPercentage = totalGames > 0 ? record.overallWins / totalGames : 0;
      
      return {
        ...record,
        winPercentage: parseFloat(winPercentage.toFixed(3))
      };
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalRecords / pageSize);
    
    // Build response
    const response: PaginatedResponse = {
      data: transformedResults,
      pagination: {
        total: totalRecords,
        page: currentPage,
        pageSize,
        totalPages,
        hasMore: currentPage < totalPages
      }
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching records:', error);
    
    // Structured error response
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'An error occurred while processing your request',
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 