import express from "express";
import * as shipmentsController from "../controllers/shipments.js";
import { verifyToken, requiredRole } from "../middleware/auth.js";

const router = express.Router();

// Shipment Routes
router.post("/register", shipmentsController.register);
router.post("/login", shipmentsController.login);

// Available Shipments for Companies
router.get("/", verifyToken, requiredRole("COMPANY"), shipmentsController.getAvailableShipments);

// Status Updates
router.patch("/:id/pickup", verifyToken, requiredRole("COMPANY"), shipmentsController.pickupShipment);
router.patch("/:id/deliver", verifyToken, requiredRole("COMPANY"), shipmentsController.deliverShipment);

export default router;
