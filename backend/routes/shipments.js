import express from "express";
import * as shipmentsController from "../controllers/shipments.js";
import { verifyToken, requiredRole } from "../middleware/auth.js";

const router = express.Router();

// Shipment Routes
router.post("/register", shipmentsController.register);
router.post("/login", shipmentsController.login);

// Available Shipments for Companies
router.get("/", verifyToken, requiredRole("COMPANY"), shipmentsController.getAvailableShipments);

export default router;
