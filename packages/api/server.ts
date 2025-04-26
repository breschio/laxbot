import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

// Example import from db package (not used yet)
// import { db, teams } from '@laxbot/db';

const app = express();
app.use(cors());
app.use(express.json());

// Placeholder GET endpoint
app.get('/api/teams', (req, res) => {
  // TODO: Replace with DB query
  res.json([
    { id: '1', name: 'Laxbot University', conference: 'Big Lax', mascot: 'Bots' },
    { id: '2', name: 'Stick State', conference: 'Stick League', mascot: 'Sticks' },
  ]);
});

// Note: In the future, set up cron jobs or scheduled tasks to run scrapers and update the DB.

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Laxbot API server running on port ${PORT}`);
}); 