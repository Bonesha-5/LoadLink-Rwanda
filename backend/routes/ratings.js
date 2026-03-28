import express from "express";
import { createRating } from "../controllers/ratings.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/", verifyToken, createRating);

export default router;
