import { parseScoreboard } from './parseScoreboard';

async function main() {
  try {
    await parseScoreboard();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error running parsers:', error);
    process.exit(1);
  }
}

main(); 