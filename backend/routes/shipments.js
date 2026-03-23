import express from "express";
import { verifyToken, requiredRole } from "../middleware/auth.js";
import * as ctrl from "../controllers/shipments.js";

const router = express.Router();

// Static routes first (before /:id param routes)
router.post("/", verifyToken, requiredRole("SHIPPER"), ctrl.postShipment);
router.get("/my", verifyToken, requiredRole("SHIPPER"), ctrl.myShipments);
router.get("/posted", verifyToken, ctrl.allPosted);
router.post("/interests", verifyToken, requiredRole("COMPANY"), ctrl.expressInterest);

// Param routes
router.get("/:id", verifyToken, ctrl.getShipment);
router.patch("/:id/select", verifyToken, requiredRole("SHIPPER"), ctrl.selectTruck);
router.patch("/:id/confirm", verifyToken, requiredRole("SHIPPER"), ctrl.confirmDelivery);
router.patch("/:id/dispute", verifyToken, requiredRole("SHIPPER"), ctrl.disputeDelivery);
router.get("/:id/interests", verifyToken, requiredRole("SHIPPER"), ctrl.getInterests);
router.get("/:id/truck-info", verifyToken, requiredRole("SHIPPER"), ctrl.getTruckInfo);
router.patch("/:id/pickup", verifyToken, requiredRole("COMPANY"), ctrl.markPickup);
router.patch("/:id/deliver", verifyToken, requiredRole("COMPANY"), ctrl.markDelivery);

export default router;
