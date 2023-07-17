import {
	GetColumnData,
	InferModel,
	Placeholder,
	SQL,
	Simplify,
	eq,
} from 'drizzle-orm';
import {
	AnyPgColumn,
	AnyPgTable,
	PgTableWithColumns,
} from 'drizzle-orm/pg-core';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

type DefaultTable = PgTableWithColumns<{
	name: string;
	schema: undefined;
	columns: {
		id: AnyPgColumn<{
			name: 'id';
			data: number;
			driverParam: number;
			hasDefault: true;
			notNull: true;
		}>;
		createdAt: AnyPgColumn<{
			name: 'created_at';
			data: Date;
			driverParam: string;
			hasDefault: true;
			notNull: true;
		}>;
		updatedAt: AnyPgColumn<{
			name: 'updated_at';
			data: Date;
			driverParam: string;
			hasDefault: false;
			notNull: false;
		}>;
	};
}>;

type PgInsertValue<TTable extends AnyPgTable> = Simplify<{
	[Key in keyof InferModel<TTable, 'insert'>]:
		| InferModel<TTable, 'insert'>[Key]
		| SQL
		| Placeholder;
}>;

type PgUpdateSetSource<TTable extends AnyPgTable> = Simplify<{
	[Key in keyof TTable['_']['columns']]?:
		| GetColumnData<TTable['_']['columns'][Key]>
		| SQL;
}>;

export enum JoinType {
	oneToMany = 'ONE_TO_MANY',
	manyToOne = 'MANY_TO_ONE',
	// "MANY_TO_MANY"
}
export abstract class BaseRepository<TTable extends DefaultTable> {
	constructor(protected _db: PostgresJsDatabase, protected _table: TTable) {}

	createOne = async (item: PgInsertValue<TTable>) => {
		const [inserted] = await this._db
			.insert(this._table)
			.values(item)
			.returning();

		return inserted;
	};

	createMany = async (items: PgInsertValue<TTable>[]) => {
		const inserted = await this._db
			.insert(this._table)
			.values(items)
			.returning()
			.execute();

		return inserted;
	};

	updateById = async ({
		id,
		item,
	}: {
		id: number;
		item: PgUpdateSetSource<TTable>;
	}) => {
		const updated = await this._db
			.update(this._table)
			.set({ ...item, updatedAt: new Date() })
			.where(eq(this._table.id, id))
			.returning()
			.execute();

		return updated.length ? updated[0] : undefined;
	};
	update = async ({
		item,
		conditions,
	}: {
		conditions: SQL | undefined;
		item: PgUpdateSetSource<TTable>;
	}) => {
		const updated = await this._db
			.update(this._table)
			.set({ ...item, updatedAt: new Date() })
			.where(conditions)
			.returning();

		return updated;
	};
	delete = async ({ conditions }: { conditions: SQL | undefined }) =>
		this._db.delete(this._table).where(conditions).returning();

	deleteById = async ({ id }: { id: number }) =>
		this._db.delete(this._table).where(eq(this._table.id, id)).returning();

	list({
		orderBy,
		condition,
		pagination,
	}: {
		orderBy?: SQL;
		condition?: SQL;
		pagination?: { page: number; perPage: number };
	}): Promise<InferModel<typeof this._table>[]>;

	list<
		TJoinTable extends DefaultTable,
		TReturnType extends {
			item: InferModel<TTable>;
			related: InferModel<TJoinTable>[];
		}
	>(
		{
			orderBy,
			condition,
			pagination,
		}: {
			orderBy?: SQL;
			condition?: SQL;
			pagination?: { page: number; perPage: number };
		},
		join: {
			table: TJoinTable;
			type: JoinType;
			on: SQL<unknown>;
		}
	): Promise<Record<number, TReturnType>>;

	async list<TJoinTable extends DefaultTable>(
		{
			orderBy,
			condition,
			pagination,
		}: {
			orderBy?: SQL;
			condition?: SQL;
			pagination?: { page: number; perPage: number };
			join?: undefined;
		},
		join?: {
			table: TJoinTable;
			type: JoinType;
			on: SQL<unknown>;
		}
	) {
		const query = this._db.select().from(this._table);

		if (condition) {
			query.where(condition);
		}

		if (orderBy) {
			query.orderBy(orderBy);
		}

		if (pagination) {
			query
				.limit(pagination.perPage)
				.offset((pagination.page - 1) * pagination.perPage);
		}

		if (join) {
			if (join.type === JoinType.oneToMany) {
				const onePropName: string = (this._table as any)[
					Object.getOwnPropertySymbols(this._table)[0]
				];
				const oneTable = this._table;

				const manyPropName: string = (join.table as any)[
					Object.getOwnPropertySymbols(join.table)[0]
				];
				const manyTable = join.table;

				const rows = await query
					.leftJoin(join.table, join.on)
					.execute();
				return rows.reduce<
					Record<
						number,
						{
							item: InferModel<typeof oneTable, 'select'>;
							related: InferModel<typeof manyTable>[];
						}
					>
				>((acc, row) => {
					const one: InferModel<typeof oneTable, 'select'> = (
						row as any
					)[onePropName];
					const many: InferModel<typeof manyTable> = (row as any)[
						manyPropName
					];
					const oneId: number | null = one.id;

					if (!oneId) {
						throw Error('Received null id');
					}

					if (!acc[oneId]) {
						acc[oneId] = { item: one, related: [] };
					}

					if (many) {
						acc[oneId].related.push(many);
					}

					return Object.values(acc);
				}, {});
			}

			if (join.type === JoinType.manyToOne) {
				const manyPropName: string = (this._table as any)[
					Object.getOwnPropertySymbols(this._table)[0]
				];
				const manyTable = this._table;

				const onePropName: string = (join.table as any)[
					Object.getOwnPropertySymbols(join.table)[0]
				];
				const oneTable = join.table;

				const rows = await query
					.leftJoin(join.table, join.on)
					.execute();
				return rows.reduce<
					Record<
						number,
						{
							item: InferModel<typeof oneTable, 'select'>;
							related: InferModel<typeof manyTable>[];
						}
					>
				>((acc, row) => {
					const one: InferModel<typeof oneTable, 'select'> = (
						row as any
					)[onePropName];
					const many: InferModel<typeof manyTable> = (row as any)[
						manyPropName
					];
					const oneId_1: number | null = one.id;

					if (!oneId_1) {
						throw Error('Received null id');
					}

					if (!acc[oneId_1]) {
						acc[oneId_1] = { item: one, related: [] };
					}

					if (many) {
						acc[oneId_1].related.push(many);
					}

					return Object.values(acc);
				}, {});
			}
		}

		return query.execute() as unknown as InferModel<typeof this._table>[];
	}

	findOne = async ({ conditions }: { conditions: SQL | undefined }) => {
		const [findingResult] = await this._db
			.select()
			.from(this._table)
			.where(conditions)
			.execute();

		return findingResult ? findingResult : undefined;
	};

	findById = async (id: number) => {
		const [findingResult] = await this._db
			.select()
			.from(this._table)
			.where(eq(this._table.id, id));

		return findingResult ? findingResult : undefined;
	};
}
