import { readFileSync } from "node:fs";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL");
  process.exit(1);
}
const sql = postgres(url, { onnotice: () => {} });
await sql.unsafe(readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));
await sql.end();
console.log("Esquema aplicado");
