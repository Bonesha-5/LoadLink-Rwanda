import express from 'express'
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from '../config/db.js'
const router = express.Router();

router.post("/shipper/register", async (req, res) => {

  const { name, phone, email, password } = req.body;

  try {

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (name, phone, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'SHIPPER')
       RETURNING id, name, email, role`,
      [name, phone, email, hashedPassword]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      token,
      user
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }

});
router.post("/shipper/login", async (req, res) => {

  const { email, password } = req.body;

  try {


    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1 AND role = 'SHIPPER'`,
      [email]
    );

    const user = result.rows[0];


    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }


    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24hrs" }
    );


    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }

});

router.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1 AND role = 'ADMIN'`,
      [email]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: "Admin not found" });

    const bcrypt = await import("bcrypt");
    const isMatch = await bcrypt.default.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
export default router;
