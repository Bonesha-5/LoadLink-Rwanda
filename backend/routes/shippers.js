import express from "express";
import * as shippersController from "../controllers/shippers.js";
import { verifyToken } from '../middleware/auth.js';
const router = express.Router();

// Shipper Auth Routes
router.post("/register", shippersController.register);
router.post("/login", shippersController.login);
router.get("/payments", verifyToken, shippersController.getMyPayments);
export default router;
