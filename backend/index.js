import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import companyRoutes from "./routes/company.js";
import shipperRoutes from "./routes/shipper.js";
import requestLogger from "./middleware/logger.js";
import errorMiddleware from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// log incoming requests
app.use(requestLogger);

app.use("/api/company", companyRoutes);
app.use("/api/shipper", shipperRoutes);

// Global Error Handler
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`LoadLink server running on port ${PORT}`);
});
