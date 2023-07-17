import { pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { integer, sqliteTable, text ,} from 'drizzle-orm/sqlite-core';

export const users = pgTable('users', {
	id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at'),
    anyProp: varchar('any_prop')
});
