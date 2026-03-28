import express from "express";
import * as interestsController from "../controllers/interests.js";
import { verifyToken, requiredRole } from "../middleware/auth.js";

const router = express.Router();

// Middleware to protect all interest routes for companies
router.use(verifyToken);
router.use(requiredRole("COMPANY"));

router.post("/", interestsController.createInterest);
router.get("/my", interestsController.getMyInterests);

export default router;
