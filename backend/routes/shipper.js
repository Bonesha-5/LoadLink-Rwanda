import express from "express";
import * as shipperController from "../controllers/shipper.js";

const router = express.Router();

// Shipper Routes
router.post("/register", shipperController.register);
router.post("/login", shipperController.login);

export default router;
