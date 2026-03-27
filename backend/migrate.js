import pool from "./config/db.js";

const migrate = async () => {
  try {
    console.log("Starting migration...");

    const companyQuery = `
            ALTER TABLE companies 
            ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
            ADD COLUMN IF NOT EXISTS business_cert_url TEXT,
            ADD COLUMN IF NOT EXISTS insurance_doc_url TEXT,
            ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'PENDING_VERIFICATION';
        `;


    // add verification_status to trucks table
    const truckQuery = `
            ALTER TABLE trucks 
            ADD COLUMN IF NOT EXISTS verification_status VARCHAR(30) DEFAULT 'PENDING',
            ADD COLUMN IF NOT EXISTS insurance_cert_path TEXT;
        `;

    await pool.query(companyQuery);
    await pool.query(truckQuery);
    console.log(
      "Migration completed successfully: Added columns to companies and trucks tables.",
    );

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrate();
