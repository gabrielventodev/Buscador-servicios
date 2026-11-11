import postgres from "postgres";

const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

export const sql =
  globalForDb.sql ??
  postgres(process.env.DATABASE_URL ?? "postgres://postgres@localhost:5432/buscador", {
    max: 5,
    // "Enviados hoy" se cuenta según el día en Argentina.
    connection: { TimeZone: process.env.APP_TIMEZONE ?? "America/Argentina/Buenos_Aires" },
    onnotice: () => {},
  });

if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;
