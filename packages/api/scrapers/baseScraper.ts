import fetch from 'node-fetch';
import { supabase } from 'db';
import { stgScoreboard } from 'db';
import { dataSources, DataSourceConfig } from './dataSources';

interface ScraperResult {
  sourceId: string;
  success: boolean;
  error?: string;
  type: 'api' | 'html';
}

async function scrapeEndpoint(config: DataSourceConfig): Promise<ScraperResult> {
  try {
    console.log(`[BaseScraper] Scraping ${config.id} from ${config.endpoint}...`);
    
    // Create a mock payload for testing
    const mockPayload = {
      test: true,
      timestamp: new Date().toISOString(),
      source: config.id,
      data: {
        games: [
          {
            id: "1234",
            status: "scheduled",
            homeTeam: "Syracuse",
            awayTeam: "Hopkins",
            date: new Date().toISOString()
          }
        ]
      }
    };
    
    console.log("[BaseScraper] Using mock payload for testing");
    console.log(`[BaseScraper] Payload size: ${JSON.stringify(mockPayload).length} characters`);
    
    try {
      // Store in staging table using Supabase
      const { data, error } = await supabase
        .from('stgScoreboard')
        .insert({
          source_id: config.id,
          raw_payload: mockPayload
        })
        .select();
      
      console.log("[BaseScraper] Insert response data:", data);
      
      if (error) {
        console.error('[BaseScraper] Supabase insert error:', error);
        console.error('[BaseScraper] Error code:', error.code);
        console.error('[BaseScraper] Error message:', error.message);
        console.error('[BaseScraper] Error details:', error.details);
        throw error;
      }

      console.log(`[BaseScraper] Stored mock payload for ${config.id} (${config.type})`);
    } catch (dbError) {
      console.error('[BaseScraper] Database error:', dbError);
      throw dbError;
    }
    
    return {
      sourceId: config.id,
      success: true,
      type: config.type
    };
  } catch (error) {
    console.error(`[BaseScraper] Error scraping ${config.id}:`, error);
    return {
      sourceId: config.id,
      success: false,
      error: error instanceof Error ? error.message : JSON.stringify(error),
      type: config.type
    };
  }
}

export async function runBaseScraper(): Promise<ScraperResult[]> {
  console.log('[BaseScraper] Starting scrape run...');
  
  const results = await Promise.all(
    dataSources
      .filter(source => source.enabled)
      .map(scrapeEndpoint)
  );

  // Log results by type
  const apiSuccesses = results.filter(r => r.success && r.type === 'api').length;
  const htmlSuccesses = results.filter(r => r.success && r.type === 'html').length;
  const failures = results.filter(r => !r.success).length;
  
  console.log(`[BaseScraper] Completed with:
  - API successes: ${apiSuccesses}
  - HTML successes: ${htmlSuccesses}
  - Failures: ${failures}`);
  
  return results;
} 