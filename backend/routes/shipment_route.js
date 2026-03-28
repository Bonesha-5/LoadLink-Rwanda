import express from "express";
import {
  createShipment,
  getMyShipments,
  getShipmentInterests,
  selectTruck,
  confirmShipment,
  disputeShipment,
  createRating,
  initiatePayment,
  getPaymentStatus
} from "../controllers/shipment_controller.js";

import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/shipments", verifyToken, createShipment);
router.get("/shipments/my", verifyToken, getMyShipments);
router.get("/shipments/:id/interests", verifyToken, getShipmentInterests);
router.patch("/shipments/:id/select", verifyToken, selectTruck);
router.patch("/shipments/:id/confirm", verifyToken, confirmShipment);
router.patch("/shipments/:id/dispute", verifyToken, disputeShipment);
router.post("/ratings", verifyToken, createRating);
router.post("/payments/initiate", verifyToken, initiatePayment);
router.get("/payments/status/:reference_id", verifyToken, getPaymentStatus);

export default router;