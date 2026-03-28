import express from "express";
import * as shipmentsController from "../controllers/shipments.js";
import { verifyToken, requiredRole } from "../middleware/auth.js";

const router = express.Router();

// Available Shipments for Companies
router.get("/", verifyToken, requiredRole("COMPANY"), shipmentsController.getAvailableShipments);

// Active Shipments (Ongoing)
router.get("/active", verifyToken, requiredRole("COMPANY"), shipmentsController.getActiveShipments);

// Status Updates
router.patch("/:id/pickup", verifyToken, requiredRole("COMPANY"), shipmentsController.pickupShipment);
router.patch("/:id/deliver", verifyToken, requiredRole("COMPANY"), shipmentsController.deliverShipment);

export default router;
