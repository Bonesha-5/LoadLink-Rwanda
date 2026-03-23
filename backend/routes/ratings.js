import express from "express";
import { verifyToken, requiredRole } from "../middleware/auth.js";
import * as ctrl from "../controllers/ratings.js";

const router = express.Router();

router.post("/", verifyToken, requiredRole("SHIPPER"), ctrl.submit);

export default router;
