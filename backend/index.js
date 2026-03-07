import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

import authRoutes from "./routes/auth.js";
app.use("/auth", authRoutes);

const companyRoute=require('./routes/companyLogin');
app.use('/api/auth/company', companyRoute);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`LoadLink server running on port ${PORT}`));
