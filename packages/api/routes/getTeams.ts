import { Request, Response } from 'express';

export const getTeams = (req: Request, res: Response) => {
  // TODO: Replace with DB query
  res.json([
    { id: '1', name: 'Laxbot University', conference: 'Big Lax', mascot: 'Bots' },
    { id: '2', name: 'Stick State', conference: 'Stick League', mascot: 'Sticks' },
  ]);
}; 