import pool from "../config/db.js";
import bcrypt from "bcrypt";

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
    business_cert_path,
    insurance_doc_path,
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
      `INSERT INTO companies (user_id, name, rdb_number, contact_person, base_district, business_cert_path, insurance_doc_path, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING_VERIFICATION') RETURNING id`,
      [
        user_id,
        name,
        rdb_number,
        contact_person,
        base_district,
        business_cert_path,
        insurance_doc_path,
      ],
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
    `SELECT u.id AS user_id, u.email, u.password_hash, u.role, u.is_suspended, 
            c.id AS company_id, c.name AS company_name, c.status AS company_status, 
            c.base_district, c.contact_person 
     FROM users u 
     JOIN companies c ON c.user_id = u.id 
     WHERE u.email = $1 AND u.role = 'COMPANY'`,
    [email],
  );
  return result.rows[0];
};

// Handle company login logic
export const loginCompany = async (email, password) => {
  const user = await findCompanyUserByEmail(email);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (user.is_suspended) {
    throw new Error("Account has been suspended");
  }

  if (user.company_status === "PENDING_VERIFICATION") {
    throw new Error("Account pending admin verification");
  }

  if (user.company_status === "REJECTED") {
    throw new Error("Account rejected");
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    throw new Error("Invalid email or password");
  }

  return user;
};
