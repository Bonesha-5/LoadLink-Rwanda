import express from "express";
import * as interestsController from "../controllers/interests.js";
import { verifyToken, requiredRole } from "../middleware/auth.js";

const router = express.Router();

// Middleware to protect all interest routes for companies
router.use(verifyToken);

router.post("/", requiredRole("COMPANY"), interestsController.createInterest);
router.get("/my", requiredRole("COMPANY"), interestsController.getMyInterests);

router.get("/shipment/:id", interestsController.getShipmentInterests);

export default router;

