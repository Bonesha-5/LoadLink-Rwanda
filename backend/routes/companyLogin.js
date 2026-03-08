import express from "express";
import { CompanyLogin } from "../controllers/companyLogin.js";

const router = express.Router();

// POST /api/auth/company/login
router.post("/login", CompanyLogin);

export default router;
