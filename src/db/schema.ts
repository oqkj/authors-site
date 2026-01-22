import { pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const authors = pgTable('authors', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  birthDate: text('birth_date'),
  deathDate: text('death_date'),
  biography: text('biography').notNull(),
  imageUrl: text('image_url'),
});

export type Author = typeof authors.$inferSelect;
export type NewAuthor = typeof authors.$inferInsert;