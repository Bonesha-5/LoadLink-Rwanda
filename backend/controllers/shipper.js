import * as shipperService from "../service/shipper.js";

// Handle shipper registration
export const register = async (req, res) => {
  const { name, phone, email, password } = req.body;

  try {
    const { user, token } = await shipperService.registerShipper(
      name,
      phone,
      email,
      password,
    );

    res.status(201).json({
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Handle shipper login
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { token, user } = await shipperService.loginShipper(email, password);

    res.json({
      token,
      user,
    });
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === "Invalid credentials") {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};
