import express from 'express';
import {
  simulatePayment,
  simulateFailure,
  simulatePayout
} from '../controllers/simulatedMomo.js';

const router = express.Router();

router.post('/pay', simulatePayment);
router.post('/fail', simulateFailure);
router.post('/payout', simulatePayout);

export default router;
