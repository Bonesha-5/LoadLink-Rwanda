import * as shipperService from "../service/shipper.js";
import { catchAsync } from "../utils/catchAsync.js";

// Handle shipper registration
export const register = catchAsync(async (req, res) => {
  const { name, phone, email, password } = req.body;

  const { user, token } = await shipperService.registerShipper(
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
    const { token, user } = await shipperService.loginShipper(email, password);

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
