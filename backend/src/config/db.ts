import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.PG_URL ||
    "postgresql://postgres:password@localhost:5433/idmap_db",
});

