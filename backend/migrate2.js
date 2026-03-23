import pool from "./config/db.js";

const migrate = async () => {
  try {
    console.log("Running migration: add delivery_timestamp to shipments...");
    await pool.query(`
      ALTER TABLE shipments
      ADD COLUMN IF NOT EXISTS delivery_timestamp TIMESTAMP;
    `);
    console.log("Migration complete.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrate();
