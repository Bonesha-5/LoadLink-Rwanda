import express from "express";
import * as trucksController from "../controllers/trucks.js";
import { verifyToken, requiredRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/:id/ratings", trucksController.getTruckRatings);

router.use(verifyToken);
router.use(requiredRole("COMPANY"));

router.get("/my", trucksController.getMyTrucks);
router.patch("/:id/status", trucksController.updateTruckStatus);
router.post("/register", trucksController.registerTruck);

export default router;