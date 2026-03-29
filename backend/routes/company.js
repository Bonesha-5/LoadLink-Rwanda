import express from "express";
import * as companyController from "../controllers/company.js";
import { registerCompany, CompanyLogin, getCompanyAnalytics } from '../controllers/company.js';
import { verifyToken, requiredRole } from '../middleware/auth.js';
const router = express.Router();

// Company Routes
router.post("/register", companyController.registerCompany);
router.post("/login", companyController.CompanyLogin);
router.get('/analytics', verifyToken, requiredRole('COMPANY'), getCompanyAnalytics);
export default router;
