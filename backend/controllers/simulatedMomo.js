import axios from 'axios';

const WEBHOOK_DELAY_MS = 3000;
const PAYOUT_DELAY_MS = 2000;

const requiredFields = (fields, body) => fields.filter(f => !body[f]);

const fireWebhook = async (webhook_url, payload) => {
  try {
    await axios.post(webhook_url, {
      ...payload,
      signature: process.env.MOMO_SIMULATOR_SECRET,
    });
    console.log(`[Simulator] Webhook fired — status: ${payload.status}`);
  } catch (err) {
    console.error(`[Simulator] Webhook failed — ${err.message}`);
  }
};

const simulatePayment = async (req, res) => {
  const { reference_id, amount, phone_number, webhook_url } = req.body;

  const missing = requiredFields(
    ['reference_id', 'amount', 'phone_number', 'webhook_url'],
    req.body
  );
  if (missing.length > 0) {
    return res.status(400).json({
      message: `Missing required fields: ${missing.join(', ')}`
    });
  }

  res.status(202).json({
    status: 'PENDING',
    referenceId: reference_id,
    message: 'Payment request received, processing...',
  });

  setTimeout(() => fireWebhook(webhook_url, {
    referenceId: reference_id,
    status: 'SUCCESSFUL',
    amount,
    phone: phone_number,
  }), WEBHOOK_DELAY_MS);
};

const simulateFailure = async (req, res) => {
  const { reference_id, webhook_url } = req.body;

  const missing = requiredFields(['reference_id', 'webhook_url'], req.body);
  if (missing.length > 0) {
    return res.status(400).json({
      message: `Missing required fields: ${missing.join(', ')}`
    });
  }

  res.status(202).json({
    status: 'PENDING',
    referenceId: reference_id,
    message: 'Simulating failure...',
  });

  setTimeout(() => fireWebhook(webhook_url, {
    referenceId: reference_id,
    status: 'FAILED',
  }), WEBHOOK_DELAY_MS);
};

const simulatePayout = async (req, res) => {
  const { company_phone, amount, reference_id, webhook_url } = req.body;

  const missing = requiredFields(
    ['company_phone', 'amount', 'reference_id', 'webhook_url'],
    req.body
  );
  if (missing.length > 0) {
    return res.status(400).json({
      message: `Missing required fields: ${missing.join(', ')}`
    });
  }

  res.status(202).json({
    status: 'PENDING',
    reference_id,
    message: `Payout of ${amount} RWF being sent to ${company_phone}...`,
  });

  setTimeout(() => fireWebhook(webhook_url, {
    referenceId: reference_id,
    status: 'PAYOUT_SUCCESSFUL',
    amount,
    recipient: company_phone,
  }), PAYOUT_DELAY_MS);
};

export { simulatePayment, simulateFailure, simulatePayout };
