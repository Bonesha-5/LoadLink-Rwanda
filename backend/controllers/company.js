import jwt from "jsonwebtoken";
import * as companyService from "../service/company.js";
import { catchAsync } from "../utils/catchAsync.js";

const JWT_SECRET = process.env.JWT_SECRET;

// Register a new company
export const registerCompany = catchAsync(async (req, res) => {
  const {
    email,
    password,
    name,
    rdb_number,
    contact_person,
    phone,
    base_district,
    business_cert_url,
    insurance_doc_url,
  } = req.body;

  // Check if user already exists
  const existingUser = await companyService.findUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "Email already registered",
    });
  }

  // Check if RDB number already exists
  const existingRDB = await companyService.findCompanyByRDB(rdb_number);
  if (existingRDB) {
    return res.status(400).json({
      success: false,
      message: "RDB number already registered",
    });
  }

  // Hash password
  const bcrypt = await import("bcrypt");
  const password_hash = await bcrypt.default.hash(password, 10);

  // Create user and company records
  await companyService.createCompanyWithUser({
    email,
    password_hash,
    name,
    rdb_number,
    contact_person,
    phone,
    base_district,
    business_cert_url,
    insurance_doc_url,
  });

  res.status(201).json({
    success: true,
    message: `${name} successfully registered`,
  });
});

// Handle company login
export const CompanyLogin = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  try {
    const user = await companyService.loginCompany(email, password);

    const token = jwt.sign(
      { id: user.user_id, role: user.role, company_id: user.company_id },
      JWT_SECRET,
      { expiresIn: "1d" },
    );

    return res.status(200).json({
      success: true,
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
  } catch (error) {
    if (error.message === "Invalid email or password") {
      error.statusCode = 401;
    } else if (
      error.message === "Account has been suspended" ||
      error.message === "Account pending admin verification" ||
      error.message === "Account rejected"
    ) {
      error.statusCode = 403;
    }
    throw error;
  }
});
