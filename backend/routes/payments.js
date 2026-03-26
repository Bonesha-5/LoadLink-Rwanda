import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  initiatePayment,
  handleWebhook,
  handlePayoutWebhook,
  getPaymentStatus,
  resolveDispute
} from '../controllers/payments.js';
import { verifyToken, requiredRole as requireRole } from '../middleware/auth.js';
import { allowOnly } from '../middleware/validate.js';

const router = express.Router();

// Rate limiter for webhook endpoints only
// Prevents webhook flooding
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: { message: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Shipper initiates escrow payment
router.post(
  '/initiate',
  verifyToken,
  requireRole('SHIPPER'),
  allowOnly(['shipment_id', 'provider', 'phone_number']),
  initiatePayment
);

// Incoming payment webhook — called by simulator
// No auth — signature verified inside handler
router.post('/webhook', webhookLimiter, handleWebhook);

// Payout webhook — called by simulator after release
// No auth — signature verified inside handler
router.post('/payout-webhook', webhookLimiter, handlePayoutWebhook);

// Frontend polls this every 2 seconds to check payment status
router.get('/status/:reference_id', verifyToken, getPaymentStatus);

// Admin resolves a disputed shipment
// Admin only — amounts act as admin signature
router.post(
  '/disputes/resolve',
  verifyToken,
  requireRole('ADMIN'),
  allowOnly(['shipment_id', 'resolution_type', 'shipper_amount', 'company_amount']),
  resolveDispute
);

export default router;
