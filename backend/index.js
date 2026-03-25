import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import shipmentRoutes from './routes/shipment_route.js';
import paymentRoutes from './routes/payments.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/api', shipmentRoutes);
app.use('/api', paymentRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`LoadLink server running on port ${PORT}`);
});