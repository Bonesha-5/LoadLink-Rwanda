import express from "express";
import * as companyController from "../controllers/company.js";

const router = express.Router();

// Company Routes
router.post("/register", companyController.registerCompany);
router.post("/login", companyController.CompanyLogin);

export default router;
