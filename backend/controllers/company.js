import jwt from "jsonwebtoken";
import * as companyService from "../service/company.js";

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
    const existingUser = await companyService.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Check if RDB number already exists
    const existingRDB = await companyService.findCompanyByRDB(rdb_number);
    if (existingRDB) {
      return res.status(400).json({ error: "RDB number already registered" });
    }

    // Hash password
    const bcrypt = await import("bcrypt");
    const password_hash = await bcrypt.default.hash(password, 10);

    // Create user and company records
    const { user_id, company_id } = await companyService.createCompanyWithUser({
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

// Handle company login
export const CompanyLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await companyService.loginCompany(email, password);

    const token = jwt.sign(
      { id: user.user_id, role: user.role, company_id: user.company_id },
      JWT_SECRET,
      { expiresIn: "1d" },
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
        company_name: user.company_name,
        contact_person: user.contact_person,
        status: user.company_status,
      },
    });
  } catch (err) {
    if (err.message === "Invalid email or password") {
      return res.status(401).json({ message: err.message });
    }
    if (
      err.message === "Account has been suspended" ||
      err.message === "Account pending admin verification" ||
      err.message === "Account rejected"
    ) {
      return res.status(403).json({ message: err.message });
    }
    console.error("Company login error:", err.message);
    return res
      .status(500)
      .json({ message: "Server error", detail: err.message });
  }
};
