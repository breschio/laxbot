import { runBaseScraper } from './baseScraper';

async function main() {
  try {
    const results = await runBaseScraper();
    const failures = results.filter(r => !r.success);
    
    if (failures.length > 0) {
      console.error('Failed sources:', failures);
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Fatal error running scrapers:', error);
    process.exit(1);
  }
}

main(); 