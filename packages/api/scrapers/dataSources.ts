export interface DataSourceConfig {
  id: string;
  type: 'api' | 'html';
  name: string;
  endpoint: string;
  frequency: number; // in minutes
  enabled: boolean;
}

export const dataSources: DataSourceConfig[] = [
  {
    id: 'espn-scoreboard',
    type: 'api',
    name: 'ESPN Scoreboard',
    endpoint: 'http://site.web.api.espn.com/apis/v2/scoreboard/header?sport=lacrosse&league=mens-college-lacrosse',
    frequency: 5,
    enabled: true
  }
]; 