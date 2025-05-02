import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { execSync } from 'child_process';

// Get directory path in ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from root directory
const envPath = resolve(__dirname, '../../.env');
console.log('Loading .env from:', envPath);
config({ path: envPath });

async function runPipeline() {
  console.log('🚀 Starting LaxBot data pipeline');
  console.log('===============================');
  
  try {
    // Step 1: Run the scoreboard scraper
    console.log('\n📊 Step 1: Scraping scoreboard data...');
    execSync('npm run scrape:scoreboard', { stdio: 'inherit' });
    
    // Step 2: Parse the scoreboard data
    console.log('\n🧮 Step 2: Parsing scoreboard data...');
    // Using the direct parser that works with Supabase
    execSync('npm run parse:scoreboard:direct', { stdio: 'inherit' });
    
    console.log('\n✅ Pipeline completed successfully!');
  } catch (error) {
    console.error('\n❌ Pipeline failed:', error);
    process.exit(1);
  }
}

runPipeline(); 