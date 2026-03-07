const express=require("express");
const router=express.Router();
const {CompanyLogin}=require('../controllers/companyLogin');

//POST /api/auth/company/login

router.post('/login', CompanyLogin);

module.exports=router;
