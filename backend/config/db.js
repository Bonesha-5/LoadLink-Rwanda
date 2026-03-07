import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool(
  process.env.db_url || process.env.DB_URL
    ? { connectionString: process.env.db_url || process.env.DB_URL }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      },
);

export default pool;
