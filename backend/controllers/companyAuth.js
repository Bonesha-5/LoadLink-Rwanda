import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  findUserByEmail,
  findCompanyByRDB,
  createCompanyWithUser,
  findCompanyUserByEmail,
} from "../service/companyAuth.js";

const JWT_SECRET = process.env.JWT_SECRET;

// Register a new company
export const registerCompany = async (req, res) => {
  const {
    email,
    password,
    name,
    rdb_number,
    contact_person,
    phone,
    base_district,
  } = req.body;

  try {
    // Check if user already exists
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Check if RDB number already exists
    const existingRDB = await findCompanyByRDB(rdb_number);

    if (existingRDB) {
      return res.status(400).json({ error: "RDB number already registered" });
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user and company records
    const { user_id, company_id } = await createCompanyWithUser({
      email,
      password_hash,
      name,
      rdb_number,
      contact_person,
      phone,
      base_district,
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        user_id,
        company_id,
        role: "COMPANY",
        email,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.status(201).json({
      message: "Company registered successfully",
      token,
      user: {
        id: user_id,
        email,
        role: "COMPANY",
        company_id,
        company_name: name,
        status: "PENDING_VERIFICATION",
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Login company
export const loginCompany = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Get user with company details
    const user = await findCompanyUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if user is suspended
    if (user.is_suspended) {
      return res.status(403).json({ error: "Account suspended" });
    }
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        user_id: user.id,
        company_id: user.company_id,
        role: user.role,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
        company_name: user.company_name,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
