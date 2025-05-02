import { pgTable, uuid, text, timestamp, date } from 'drizzle-orm/pg-core';
import { conferences } from './conferences';

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  mascot: text('mascot'),
  abbreviation: text('abbreviation'),
  gender: text('gender'),
  level: text('level'),
  division: text('division'),
  conference_id: uuid('conference_id').references(() => conferences.id),
  espn_id: text('espn_id'),               // ← new ESPN team ID column
  created_at: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  founded: date('founded'),
  school: text('school'),
});
