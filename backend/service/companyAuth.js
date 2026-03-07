import pool from "../config/db.js";

// Check if user exists by email
export const findUserByEmail = async (email) => {
  const result = await pool.query("SELECT id FROM users WHERE email = $1", [
    email,
  ]);
  return result.rows[0];
};

// Check if RDB number exists
export const findCompanyByRDB = async (rdb_number) => {
  const result = await pool.query(
    "SELECT id FROM companies WHERE rdb_number = $1",
    [rdb_number],
  );
  return result.rows[0];
};

// Create user and company records in a transaction
export const createCompanyWithUser = async (userData) => {
  const {
    email,
    password_hash,
    name,
    rdb_number,
    contact_person,
    phone,
    base_district,
  } = userData;

  await pool.query("BEGIN");

  try {
    // Create user record
    const userResult = await pool.query(
      `INSERT INTO users (role, name, phone, email, password_hash) 
       VALUES ('COMPANY', $1, $2, $3, $4) RETURNING id`,
      [contact_person, phone, email, password_hash],
    );

    const user_id = userResult.rows[0].id;

    // Create company record
    const companyResult = await pool.query(
      `INSERT INTO companies (user_id, name, rdb_number, contact_person, base_district) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [user_id, name, rdb_number, contact_person, base_district],
    );

    const company_id = companyResult.rows[0].id;

    await pool.query("COMMIT");

    return { user_id, company_id };
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
};

// Find company user with all details for login
export const findCompanyUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT u.id, u.email, u.password_hash, u.role, u.is_suspended,
            c.id as company_id, c.name as company_name, c.status
     FROM users u
     LEFT JOIN companies c ON u.id = c.user_id
     WHERE u.email = $1 AND u.role = 'COMPANY'`,
    [email],
  );
  return result.rows[0];
};
