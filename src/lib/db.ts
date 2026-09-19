import { Pool, types, type PoolClient } from "pg";

export type DbSource = "supabase";
export const dbSource: DbSource = "supabase";

export interface Sql {
  <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]>;
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
  transaction<T>(callback: (sql: Sql) => Promise<T>): Promise<T>;
}

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. Add the Supabase PostgreSQL connection string to Vercel.");
}

types.setTypeParser(20, Number);
types.setTypeParser(1082, (value) => value);
types.setTypeParser(1186, (value) => value);
const globalRef = globalThis as typeof globalThis & { __supabasePool__?: Pool };
const pool = globalRef.__supabasePool__ ?? new Pool({ connectionString: databaseUrl, max: 5 });
globalRef.__supabasePool__ = pool;

function makeSql(client?: PoolClient): Sql {
  const execute = (text: string, values: unknown[] = []) => client ? client.query(text, values) : pool.query(text, values);
  const sql = (async <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> => {
    let text = strings[0] ?? "";
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1] ?? ""}`;
    return (await execute(text, values)).rows as T[];
  }) as unknown as Sql;
  sql.query = async <T = Record<string, unknown>>(text: string, params: unknown[] = []) =>
    (await execute(text, params)).rows as T[];
  sql.transaction = async <T>(callback: (sql: Sql) => Promise<T>) => {
    const connection = await pool.connect();
    try {
      await connection.query("begin");
      const result = await callback(makeSql(connection));
      await connection.query("commit");
      return result;
    } catch (error) {
      await connection.query("rollback");
      throw error;
    } finally {
      connection.release();
    }
  };
  return sql;
}

const sql = makeSql();

export function getSql(): Promise<Sql> {
  if (typeof window !== "undefined") throw new Error("Database access is server-only.");
  return Promise.resolve(sql);
}

export function ensureDbReady(): Promise<void> {
  return Promise.resolve();
}

export function isUniqueViolation(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "23505");
}

export default sql;
