import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from './routes/auth.js';
import shipmentRoutes from './routes/shipment_route.js';
import paymentRoutes from './routes/payments.js';
import companyRoutes from "./routes/company.js";
import shipperRoutes from "./routes/shipper.js";
import simulatedMomoRoutes from './routes/simulatedMomo.js';
import requestLogger from "./middleware/logger.js";
import errorMiddleware from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log incoming requests
app.use(requestLogger);

app.use('/auth', authRoutes);
app.use('/api', shipmentRoutes);
app.use('/api', paymentRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/shipper', shipperRoutes);
app.use('/api/momo-simulator', simulatedMomoRoutes);

// Global error handler
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`LoadLink server running on port ${PORT}`);
});