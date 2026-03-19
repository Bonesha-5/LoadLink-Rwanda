import * as shipmentsService from "../service/shipments.js";
import { catchAsync } from "../utils/catchAsync.js";

// Handle shipper registration
export const register = catchAsync(async (req, res) => {
  const { name, phone, email, password } = req.body;

  const { user, token } = await shipmentsService.registerShipper(
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
    const { token, user } = await shipmentsService.loginShipper(email, password);

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

// Fetch available shipments 
export const getAvailableShipments = catchAsync(async (req, res) => {
  const { company_id } = req.user;

  if (!company_id) {
    return res.status(400).json({
      success: false,
      message: "Company ID not found in token",
    });
  }

  const shipments = await shipmentsService.getAvailableShipmentsForCompany(company_id);

  res.status(200).json({
    success: true,
    data: shipments,
  });
});
