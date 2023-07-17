import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/postgres-js';
import { users } from './schema/users';
import { UserRepository } from './repositories/UserRepository';
import { Table, and, asc, eq } from 'drizzle-orm';
import {
	ForeignKey,
	PgTable,
	integer,
	pgTable,
	serial,
} from 'drizzle-orm/pg-core';
import { log, profile } from 'console';
import postgres from 'postgres';
import { ProfilesRepository } from './repositories/ProfilesRepository';
import { profiles } from './schema/profiles';
import { JoinType } from './repositories/BaseRepository';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const client = postgres(
	'postgres://postgres:postgres@localhost:5432/template1'
);
const migrationClient = postgres(
	'postgres://postgres:postgres@localhost:5432/template1',
	{ max: 1 }
);

const db = drizzle(client);

const userRepo = new UserRepository(db, users);
const profileRepo = new ProfilesRepository(db, profiles);

const main = async () => {
	await migrate(drizzle(migrationClient), { migrationsFolder: './drizzle' });
	// await profileRepo.createMany([{userId: 1}, {userId: 1}, {userId: 1}, {userId: 2}, {userId: 2}])
	// log('created')
	const usersWithoutProfiles = await userRepo.list({});

	usersWithoutProfiles[0].anyProp; //type safe !!!

	log(usersWithoutProfiles);

	const usersWithProfiles = await userRepo.list(
		{},
		{
			on: eq(users.id, profiles.userId),
			table: profiles,
			type: JoinType.oneToMany,
		}
	);

	log(usersWithProfiles);

	usersWithProfiles[1].item.anyProp;
	usersWithProfiles[1].related[0].userId;

	const usersWithProfilesThroughProfileRepo = await userRepo.list(
		{},
		{
			on: eq(users.id, profiles.userId),
			table: profiles,
			type: JoinType.manyToOne,
		}
	);

	log(usersWithProfilesThroughProfileRepo)
};

main();
