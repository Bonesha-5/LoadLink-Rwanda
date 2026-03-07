import express from "express";
import * as authController from "../controllers/companyAuth.js";
import * as authService from "../service/companyAuth.js";
const router = express.Router();

// POST /auth/shipper/register  → Backend Person 2 (Esther)
// POST /auth/shipper/login     → Backend Person 2 (Esther)
// POST /auth/company/register  → Backend Person 3 (Samuel)
router.post("/company/register", authController.registerCompany);

// POST /auth/company/login     → Backend Person 4 (Annie)
router.post("/company/login", authController.loginCompany);

export default router;
