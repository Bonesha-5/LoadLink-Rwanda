import express from "express";
import * as companyController from "../controllers/company.js";
import { verifyToken, requiredRole } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", companyController.registerCompany);
router.post("/login", companyController.CompanyLogin);
router.get("/trucks", verifyToken, requiredRole("COMPANY"), companyController.getMyTrucks);

export default router;
