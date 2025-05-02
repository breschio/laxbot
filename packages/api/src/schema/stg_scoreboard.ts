import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const stgScoreboard = pgTable('stgScoreboard', {
  id: uuid('id').primaryKey().defaultRandom(),
  source_id: text('source_id').notNull(),
  raw_payload: jsonb('raw_payload').notNull(),
  scraped_at: timestamp('scraped_at').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
}); 