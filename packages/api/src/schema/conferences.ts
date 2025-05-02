import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const conferences = pgTable('conferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  source_url: text('source_url'),
  created_at: timestamp('created_at').defaultNow().notNull()
}); 