import express from "express";
import * as shippersController from "../controllers/shippers.js";

const router = express.Router();

// Shipper Auth Routes
router.post("/register", shippersController.register);
router.post("/login", shippersController.login);

export default router;
