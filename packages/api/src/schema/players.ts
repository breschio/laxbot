import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  full_name: text('full_name').notNull(),
  position: text('position'),
  class_year: text('class_year'),
  hometown: text('hometown'),
  height: text('height'),
  weight: text('weight'),
  created_at: timestamp('created_at').defaultNow().notNull()
}); 