import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import companyRoutes from "./routes/company.js";
import shippersRoutes from "./routes/shippers.js";
import shipmentsRoutes from "./routes/shipments.js";
import interestsRoutes from "./routes/interests.js";
import trucksRoutes from "./routes/trucks.js";
import requestLogger from "./middleware/logger.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
import paymentsRoutes from './routes/payments.js';
import simulatedMomoRoutes from './routes/simulatedMomo.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// log incoming requests
app.use(requestLogger);

app.use("/api/company", companyRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/momo-simulator', simulatedMomoRoutes);
app.use("/api/shippers", shippersRoutes);
app.use("/api/shipments", shipmentsRoutes);
app.use("/api/interests", interestsRoutes);
app.use("/api/trucks", trucksRoutes);

// Global Error Handler
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`LoadLink server running on port ${PORT}`);
});
