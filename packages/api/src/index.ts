import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import recordsRouter from './routes/getRecords';
import scheduleRouter from './routes/getSchedule';
import standingsRouter from './routes/standings';
import rankingsRouter from './routes/rankings';

// Get directory path in ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, '../../../.env');
console.log('Loading environment variables from:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
}

// Log environment vars for debugging (without revealing sensitive values)
console.log('Environment variables loaded:');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

// Create Express application
const app: Express = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Remove the problematic options route with asterisk
app.use(express.json());

// Add API routes
app.use('/api', recordsRouter);
app.use('/api', scheduleRouter);
app.use('/api', standingsRouter);
app.use('/api', rankingsRouter);

// Test endpoint for Supabase connection
// @ts-ignore // Ignore Express async handler type issue
app.get('/api/test-supabase', async (req: Request, res: Response) => {
  try {
    const { supabase } = await import('@db');
    const { data, error } = await supabase.from('teams').select('*').limit(1);
    
    if (error) {
      console.error('Supabase test error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Error testing Supabase:', err);
    return res.status(500).json({ error: String(err) });
  }
});

// List tables endpoint
// @ts-ignore // Ignore Express async handler type issue
app.get('/api/list-tables', async (req: Request, res: Response) => {
  try {
    const { supabase } = await import('@db');
    
    // Try using RPC call for function that lists tables
    const { data, error } = await supabase.rpc('list_tables');
    
    if (error) {
      console.error('Error listing tables:', error);
      
      // If RPC fails, return the tables we know exist
      const knownTables = ['teams', 'conferences', 'players', 'rankings', 'records'];
      return res.json({ tables: knownTables, note: 'Using known tables list (RPC failed)' });
    }
    
    return res.json({ tables: data });
  } catch (err) {
    console.error('Error listing tables:', err);
    
    // Fallback to known tables
    const knownTables = ['teams', 'conferences', 'players', 'rankings', 'records'];
    return res.json({ tables: knownTables, note: 'Using known tables list (exception occurred)' });
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'laxbot-api' });
});

// Start server
app.listen(PORT, () => {
  console.log(`[Server] LaxBot API running on port ${PORT}`);
});

// For clean shutdown
process.on('SIGINT', () => {
  console.log('[Server] Shutting down gracefully');
  process.exit(0);
});

export default app; 