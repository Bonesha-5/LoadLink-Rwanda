import * as shippersService from "../service/shippers.js";
import { catchAsync } from "../utils/catchAsync.js";
import pool from '../config/db.js';
// Handle shipper registration
export const register = catchAsync(async (req, res) => {
  const { name, phone, email, password } = req.body;

  const { user, token } = await shippersService.registerShipper(
    name,
    phone,
    email,
    password,
  );

  res.status(201).json({
    success: true,
    token,
    user,
  });
});

// Handle shipper login
export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  try {
    const { token, user } = await shippersService.loginShipper(email, password);

    res.json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    if (error.message === "User not found") {
      error.statusCode = 404;
    } else if (error.message === "Invalid credentials") {
      error.statusCode = 401;
    }
    throw error;
  }
});

export const getMyPayments = catchAsync(async (req, res) => {
  const shipper_id = req.user.id;
  const result = await pool.query(`
    SELECT p.id, p.amount, p.status, p.created_at,
           p.provider_reference,
           s.pickup_district, s.dropoff_district
    FROM payments p
    JOIN shipments s ON s.id = p.shipment_id
    WHERE p.shipper_id = $1
    ORDER BY p.created_at DESC
  `, [shipper_id]);
  res.json(result.rows);
});
