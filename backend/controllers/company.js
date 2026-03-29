import jwt from "jsonwebtoken";
import * as companyService from "../service/company.js";
import { catchAsync } from "../utils/catchAsync.js";
import pool from '../config/db.js';
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
    business_cert_path,
    insurance_doc_path,
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
    business_cert_path,
    insurance_doc_path,
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
export const getCompanyAnalytics = async (req, res) => {
  const { company_id } = req.user;
  try {
    // Shipments active today (any status except POSTED/CANCELLED)
const todayResult = await pool.query(`
  SELECT COUNT(*) AS count
  FROM shipments s
  JOIN trucks t ON t.id = s.selected_truck_id
  WHERE t.company_id = $1
  AND s.status IN ('ESCROW_FUNDED', 'IN_TRANSIT', 'AWAITING_CONFIRMATION', 'COMPLETED')
  AND s.created_at >= NOW() - INTERVAL '7 days'
`, [company_id]);

    // Weekly shipments (last 7 days)
  const weeklyResult = await pool.query(`
  SELECT TO_CHAR(s.created_at, 'Dy') AS name,
         COUNT(*) AS shipments
  FROM shipments s
  JOIN trucks t ON t.id = s.selected_truck_id
  WHERE t.company_id = $1
  AND s.created_at >= NOW() - INTERVAL '7 days'
  GROUP BY DATE(s.created_at), TO_CHAR(s.created_at, 'Dy')
  ORDER BY DATE(s.created_at) ASC
`, [company_id]);

    // On-time rate (delivered before or on pickup_date)
   const onTimeResult = await pool.query(`
  SELECT
    COUNT(*) FILTER (
      WHERE s.pickup_date IS NOT NULL
      AND s.delivered_at <= s.pickup_date + INTERVAL '1 day'
    ) AS on_time,
    COUNT(*) FILTER (WHERE s.pickup_date IS NOT NULL) AS total
  FROM shipments s
  JOIN trucks t ON t.id = s.selected_truck_id
  WHERE t.company_id = $1
  AND s.status = 'COMPLETED'
  AND s.delivered_at IS NOT NULL
`, [company_id]);

    const { on_time, total } = onTimeResult.rows[0];
    const on_time_rate = total > 0 ? Math.round((on_time / total) * 100) : null;

    res.status(200).json({
      shipments_today: Number(todayResult.rows[0].count),
      weekly: weeklyResult.rows.map(r => ({ name: r.name, shipments: Number(r.shipments) })),
      on_time_rate,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
