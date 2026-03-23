import express from "express";
import { verifyToken, requiredRole } from "../middleware/auth.js";
import * as ctrl from "../controllers/payments.js";

const router = express.Router();

router.post("/initiate", verifyToken, requiredRole("SHIPPER"), ctrl.initiate);
router.get("/my", verifyToken, requiredRole("SHIPPER"), ctrl.myPayments);
router.post("/webhook", ctrl.webhook); // public — called by MoMo provider
router.get("/shipment/:shipment_id", verifyToken, ctrl.getByShipment);

export default router;
