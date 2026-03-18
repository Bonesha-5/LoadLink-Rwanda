import pool from "./config/db.js";

const migrate = async () => {
  try {
    console.log("Starting migration...");

    const query = `
            ALTER TABLE companies 
            ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
            ADD COLUMN IF NOT EXISTS business_cert_url TEXT,
            ADD COLUMN IF NOT EXISTS insurance_doc_url TEXT,
            ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'PENDING_VERIFICATION';
        `;

    await pool.query(query);
    console.log(
      "Migration completed successfully: Added columns to companies table.",
    );

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrate();
