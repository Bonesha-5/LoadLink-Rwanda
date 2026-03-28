import express from "express";
import * as shipmentsController from "../controllers/shipments.js";
import { verifyToken, requiredRole } from "../middleware/auth.js";

const router = express.Router();

// Shipper creates a new shipment
router.post("/", verifyToken, shipmentsController.createShipment);

// Available Shipments for Companies
router.get("/", verifyToken, requiredRole("COMPANY"), shipmentsController.getAvailableShipments);

// Active Shipments (Ongoing)
router.get("/active", verifyToken, requiredRole("COMPANY"), shipmentsController.getActiveShipments);

// Status Updates
router.patch("/:id/pickup", verifyToken, requiredRole("COMPANY"), shipmentsController.pickupShipment);
router.patch("/:id/deliver", verifyToken, requiredRole("COMPANY"), shipmentsController.deliverShipment);

// Shipment Management for Shippers
router.get("/my", verifyToken, shipmentsController.getMyShipments);
router.patch("/:id/select", verifyToken, shipmentsController.selectTruck);
router.patch("/:id/confirm", verifyToken, shipmentsController.confirmShipment);
router.patch("/:id/dispute", verifyToken, shipmentsController.disputeShipment);

export default router;

