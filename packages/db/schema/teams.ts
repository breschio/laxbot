import { pgTable, uuid, text, timestamp, date } from 'drizzle-orm/pg-core';

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  conferenceId: uuid('conference_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  founded: date('founded'),
  mascot: text('mascot'),
  school: text('school'),
}); 