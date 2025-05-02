// packages/api/debugPaths.ts
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url'; // Import necessary function

console.log("--- Debug Path Information ---");

// 1. Log process.cwd() and __dirname equivalent
const currentWorkingDirectory = process.cwd();
// Get __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const scriptDirectory = path.dirname(__filename);

console.log(`Current Working Directory (process.cwd()): ${currentWorkingDirectory}`);
console.log(`Script Directory (import.meta.url):       ${scriptDirectory}`);
console.log("-----------------------------");

// 2. Recursively list all .ts files under the current directory (cwd)
console.log(`Listing .ts files under ${currentWorkingDirectory}:`);
const listTsFiles = (dir: string, prefix = ''): string[] => {
    let results: string[] = [];
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.join(prefix, entry.name);
            if (entry.isDirectory()) {
                // Exclude node_modules for brevity
                if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
                    results = results.concat(listTsFiles(fullPath, relativePath));
                }
            } else if (entry.isFile() && entry.name.endsWith('.ts')) {
                results.push(relativePath);
            }
        }
    } catch (error: any) { // Added type annotation for error
        console.error(`Error reading directory ${dir}: ${error.message}`);
    }
    return results;
};

const tsFiles = listTsFiles(currentWorkingDirectory);
if (tsFiles.length > 0) {
    tsFiles.forEach(file => console.log(` - ${file}`));
} else {
    console.log(" - No .ts files found.");
}
console.log("-----------------------------");


// 3. Check for existence of "runRankings.ts" relative to the script directory
console.log(`Checking for runRankings.ts relative to ${scriptDirectory}:`);

const checkPath1 = path.resolve(scriptDirectory, 'runRankings.ts');
const checkPath2 = path.resolve(scriptDirectory, '../runners/runRankings.ts'); // Check relative to script dir
const checkPath3 = path.resolve(scriptDirectory, 'scrapers/runners/runRankings.ts'); // Check relative to script dir

console.log(` - Checking in ./ (relative to script): ${checkPath1}`);
console.log(`   Exists? ${fs.existsSync(checkPath1)}`);

console.log(` - Checking in ../runners/ (relative to script): ${checkPath2}`);
console.log(`   Exists? ${fs.existsSync(checkPath2)}`);

console.log(` - Checking in ./scrapers/runners/ (relative to script): ${checkPath3}`);
console.log(`   Exists? ${fs.existsSync(checkPath3)}`);

console.log("-----------------------------");

// Also check relative to CWD for comparison
console.log(`Checking for runRankings.ts relative to ${currentWorkingDirectory}:`);
const checkPathCwd = path.resolve(currentWorkingDirectory, 'scrapers/runners/runRankings.ts');
console.log(` - Checking in ./scrapers/runners/ (relative to cwd): ${checkPathCwd}`);
console.log(`   Exists? ${fs.existsSync(checkPathCwd)}`);


console.log("--- End Debug ---"); 