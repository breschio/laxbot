# LaxBot Records API Endpoint Documentation

## Endpoint: `/api/records`

Get team records with various filtering, sorting, and pagination options.

### Base URL
```
http://localhost:3001/api/records
```

### HTTP Method
`GET`

### Query Parameters

| Parameter   | Type    | Default           | Description                                    |
|-------------|---------|-------------------|------------------------------------------------|
| seasonYear  | number  | Current year      | Season year to filter records                  |
| page        | number  | 1                 | Page number for pagination                     |
| limit       | number  | 20                | Number of records per page (max 100)           |
| teamId      | string  | -                 | Filter by specific team ID                     |
| minWins     | number  | -                 | Filter teams with at least this many wins      |
| sort        | string  | 'wins'            | Sort records by: 'wins', 'winpct', or 'name'   |

### Response Format

```json
{
  "data": [
    {
      "teamId": "string",
      "name": "string",
      "abbreviation": "string",
      "overallWins": 0,
      "overallLosses": 0,
      "conferenceWins": 0,
      "conferenceLosses": 0,
      "winPercentage": 0.000,
      "updatedAt": "string"
    }
  ],
  "pagination": {
    "total": 0,
    "page": 0,
    "pageSize": 0,
    "totalPages": 0,
    "hasMore": false
  }
}
```

### Error Responses

| Status Code | Description           | Response                                      |
|-------------|-----------------------|-----------------------------------------------|
| 400         | Bad Request           | Invalid parameters with explanation           |
| 500         | Internal Server Error | Server error with timestamp                   |

### Example Queries

#### Basic Query
Get the default list of records (first page, current season):
```
GET /api/records
```

#### Pagination
Get the second page with 10 records per page:
```
GET /api/records?page=2&limit=10
```

#### Filtering by Season
Get records for the 2023 season:
```
GET /api/records?seasonYear=2023
```

#### Filtering by Team
Get record for a specific team:
```
GET /api/records?teamId=750af2f2-d069-430d-8cab-65922d48171c
```

#### Filtering by Performance
Get only teams with at least 5 wins:
```
GET /api/records?minWins=5
```

#### Sorting Options
Sort by win percentage (highest first):
```
GET /api/records?sort=winpct
```

Sort by team name (alphabetical):
```
GET /api/records?sort=name
```

#### Combined Query
Get top 5 winning teams for 2022 with at least 8 wins:
```
GET /api/records?seasonYear=2022&minWins=8&sort=winpct&limit=5
```

### Implementation Notes

- Win percentage is calculated as `overallWins / (overallWins + overallLosses)`
- All number parameters must be valid integers
- Page must be >= 1, limit must be between 1 and 100
- If no records match the query parameters, an empty data array is returned
- The `hasMore` pagination field indicates if there are more pages available 