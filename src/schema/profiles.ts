import { pgTable, serial, timestamp, integer } from 'drizzle-orm/pg-core';
import { users } from './users';

export const profiles = pgTable('profiles', {
	id: serial('id').primaryKey(),
	userId: integer('user_id').references(() => users.id),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at'),
});
