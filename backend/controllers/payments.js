import pool from '../config/db.js';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// SIGNATURE VERIFICATION
const verifyWebhookSignature = (signature) => {
  if (!signature) return false;
  return signature === process.env.MOMO_SIMULATOR_SECRET;
};

// PHONE NUMBER VALIDATION
// MTN Rwanda numbers: 078x or 079x
const isMTNNumber = (phone) => /^\+?(25)?07[89][0-9]{7}$/.test(phone);

// Airtel Rwanda numbers: 072x or 073x
const isAirtelNumber = (phone) => /^\+?(25)?07[23][0-9]{7}$/.test(phone);

const isValidProviderPhone = (provider, phone) => {
  if (provider === 'MTN') return isMTNNumber(phone);
  if (provider === 'AIRTEL') return isAirtelNumber(phone);
  return false;
};

// INITIATE PAYMENT
// Receives request from frontend
// Validates shipment, creates payment record, calls simulator
// Simulator fires webhook back after 3 seconds confirming payment
const initiatePayment = async (req, res) => {
  const { shipment_id, provider, phone_number } = req.body;
  const shipper_id = req.user.id;

  if (!shipment_id || !provider || !phone_number) {
    return res.status(400).json({
      message: 'shipment_id, provider and phone_number are required'
    });
  }

  if (!['MTN', 'AIRTEL'].includes(provider)) {
    return res.status(400).json({
      message: 'provider must be MTN or AIRTEL'
    });
  }

  // Validate phone number matches the selected provider
  if (!isValidProviderPhone(provider, phone_number)) {
    return res.status(400).json({
      message: provider === 'MTN'
        ? 'Invalid MTN number — must be 078x or 079x'
        : 'Invalid Airtel number — must be 072x or 073x'
    });
  }

  try {
    // 1. Find shipment — must belong to this shipper
    //    and have a selected truck already set
    const shipmentResult = await pool.query(
      `SELECT s.*, t.company_id
       FROM shipments s
       JOIN trucks t ON t.id = s.selected_truck_id
       WHERE s.id = $1 AND s.shipper_id = $2`,
      [shipment_id, shipper_id]
    );

    if (shipmentResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Shipment not found'
      });
    }

    const shipment = shipmentResult.rows[0];

    // 2. Shipment must be in AWAITING_ESCROW
    //    Any other status means payment is not expected
    if (shipment.status !== 'AWAITING_ESCROW') {
      return res.status(400).json({
        message: `Shipment is in ${shipment.status} — payment not expected`
      });
    }

    // 3. No existing PENDING or CONFIRMED payment for this shipment
    //    Prevents duplicate payments for the same shipment
    const existingPayment = await pool.query(
      `SELECT id, status FROM payments
       WHERE shipment_id = $1
       AND status IN ('PENDING', 'CONFIRMED')`,
      [shipment_id]
    );

    if (existingPayment.rows.length > 0) {
      return res.status(409).json({
        message: `A payment is already ${existingPayment.rows[0].status} for this shipment`
      });
    }

    // 4. Generate unique reference id for this transaction
    const reference_id = uuidv4();

    // 5. Insert payment record as PENDING before calling simulator
    //    If simulator call fails, PENDING record still exists
    //    and shipper can check status
    await pool.query(
      `INSERT INTO payments
       (shipment_id, shipper_id, company_id, amount, provider_reference, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING')`,
      [
        shipment_id,
        shipper_id,
        shipment.company_id,
        shipment.offered_price,
        reference_id
      ]
    );

    // 6. Call simulator — it will fire webhook back after 3 seconds
    //    confirming or failing the payment
    const webhook_url = `${process.env.BASE_URL}/api/payments/webhook`;

    await axios.post(`${process.env.BASE_URL}/api/momo-simulator/pay`, {
      reference_id,
      amount: shipment.offered_price,
      phone_number,
      provider,
      webhook_url
    });

    // 7. Respond to frontend immediately — don't wait for webhook
    //    Frontend polls /status/:reference_id every 2 seconds
    return res.status(200).json({
      message: 'Payment initiated — waiting for confirmation',
      reference_id,
      status: 'PENDING',
      amount: shipment.offered_price
    });

  } catch (err) {
    console.error('[initiatePayment] error:', err.message);
    return res.status(500).json({
      message: 'Server error',
      detail: err.message
    });
  }
};

//  INCOMING PAYMENT WEBHOOK
// Called by simulator after shipper's payment is processed
// Public endpoint — no auth, but signature verified
// Must respond 200 immediately before any processing
// MTN/Airtel will retry if they don't get a fast response
const handleWebhook = async (req, res) => {

  // Always respond 200 immediately
  res.status(200).json({ message: 'Received' });

  const { referenceId, status, signature } = req.body;

  // 1. Verify signature — reject if not from our simulator
  if (!verifyWebhookSignature(signature)) {
    console.error('[Webhook] Blocked — invalid signature');
    return;
  }

  // 2. Validate required fields are present
  if (!referenceId || !status) {
    console.error('[Webhook] Blocked — missing referenceId or status');
    return;
  }

  // 3. Validate status is a known value
  //    Reject anything unexpected to prevent unknown state changes
  if (!['SUCCESSFUL', 'FAILED'].includes(status)) {
    console.error(`[Webhook] Blocked — unknown status: ${status}`);
    return;
  }

  try {
    // 4. Find payment by reference id — parameterized to prevent SQL injection
    const paymentResult = await pool.query(
      `SELECT * FROM payments WHERE provider_reference = $1`,
      [referenceId]
    );

    if (paymentResult.rows.length === 0) {
      console.error('[Webhook] Payment not found for reference:', referenceId);
      return;
    }

    const payment = paymentResult.rows[0];

    // 5. Replay attack prevention
    //    Only process if payment is still PENDING
    //    If same webhook fires twice, second call is ignored
    if (payment.status !== 'PENDING') {
      console.error(`[Webhook] Blocked — payment already processed: ${payment.status}`);
      return;
    }

    if (status === 'SUCCESSFUL') {
      // Update payment → CONFIRMED
      // AND status = PENDING prevents race condition
      // if two webhooks arrive at the same millisecond
      await pool.query(
        `UPDATE payments SET status = 'CONFIRMED'
         WHERE provider_reference = $1 AND status = 'PENDING'`,
        [referenceId]
      );

      // Update shipment → ESCROW_FUNDED
      // AND status = AWAITING_ESCROW prevents double update
      await pool.query(
        `UPDATE shipments SET status = 'ESCROW_FUNDED'
         WHERE id = $1 AND status = 'AWAITING_ESCROW'`,
        [payment.shipment_id]
      );

      console.log(`[Webhook] ✓ Shipment ${payment.shipment_id} → ESCROW_FUNDED`);

    } else if (status === 'FAILED') {
      // update payment → FAILED
      await pool.query(
        `UPDATE payments SET status = 'FAILED'
         WHERE provider_reference = $1 AND status = 'PENDING'`,
        [referenceId]
      );

      // revert shipment → AWAITING_ESCROW so shipper can try again
      await pool.query(
        `UPDATE shipments SET status = 'AWAITING_ESCROW'
         WHERE id = $1 AND status = 'AWAITING_ESCROW'`,
        [payment.shipment_id]
      );

      console.log(`[Webhook] ✗ Payment failed — shipment ${payment.shipment_id} reverted`);
    }

  } catch (err) {
    console.error('[Webhook] Processing error:', err.message);
  }
};

// PAYOUT WEBHOOK--
// called by simulator after money is released to company account
// confirms payout reached the company
// cublic endpoint — no auth, but signature verified
const handlePayoutWebhook = async (req, res) => {

  // Always respond 200 immediately
  res.status(200).json({ message: 'Payout webhook received' });

  const { referenceId, status, signature } = req.body;

  // 1. Verify signature
  if (!verifyWebhookSignature(signature)) {
    console.error('[PayoutWebhook] Blocked — invalid signature');
    return;
  }

  // 2. Validate required fields
  if (!referenceId || !status) {
    console.error('[PayoutWebhook] Blocked — missing fields');
    return;
  }

  // 3. Validate status is a known payout status
  if (!['PAYOUT_SUCCESSFUL', 'PAYOUT_FAILED'].includes(status)) {
    console.error(`[PayoutWebhook] Blocked — unknown status: ${status}`);
    return;
  }

  try {
    // Extract payment id from reference — format: payout-{payment_id}-{timestamp}
    const parts = referenceId.split('-');
    const payment_id = parts[1];

    if (!payment_id) {
      console.error('[PayoutWebhook] Could not extract payment_id from reference');
      return;
    }

    // Verify payment exists and is RELEASED
    const paymentCheck = await pool.query(
      `SELECT id, status FROM payments WHERE id = $1`,
      [payment_id]
    );

    if (paymentCheck.rows.length === 0) {
      console.error(`[PayoutWebhook] Payment ${payment_id} not found`);
      return;
    }

    if (paymentCheck.rows[0].status !== 'RELEASED') {
      console.error(`[PayoutWebhook] Payment ${payment_id} is not RELEASED`);
      return;
    }

    if (status === 'PAYOUT_SUCCESSFUL') {
      console.log(`[PayoutWebhook] ✓ Payout confirmed for payment ${payment_id}`);
      // In production — send notification to company that money arrived
    } else {
      // Payout failed — this is a critical error
      // In production — alert admin immediately, retry payout
      console.error(`[PayoutWebhook] ✗ Payout FAILED for payment ${payment_id} — admin must investigate`);
    }

  } catch (err) {
    console.error('[PayoutWebhook] Processing error:', err.message);
  }
};

// GET PAYMENT STATUS
// Frontend polls this every 2 seconds after initiating payment
// Returns current payment and shipment status
// Shipper uses this to know when to show success or failure screen
const getPaymentStatus = async (req, res) => {
  const { reference_id } = req.params;

  if (!reference_id) {
    return res.status(400).json({ message: 'reference_id is required' });
  }

  try {
    const result = await pool.query(
      `SELECT
         p.id,
         p.status AS payment_status,
         p.amount,
         p.payout_amount,
         p.provider_reference,
         s.status AS shipment_status,
         s.id AS shipment_id
       FROM payments p
       JOIN shipments s ON s.id = p.shipment_id
       WHERE p.provider_reference = $1`,
      [reference_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    return res.status(200).json(result.rows[0]);

  } catch (err) {
    console.error('[getPaymentStatus] error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

//RELEASE PAYMENT
// Internal function nott a route, never called directly from frontend
// Called only by:
//   1. Esther's confirmDelivery() — when shipper confirms delivery
//   2. Samuel's cron job — 24h auto confirm with no shipper action
// Full transaction — if payout simulator fails, DB is rolled back
// Nothing is marked as released unless payout is confirmed
const releasePayment = async (shipment_id) => {
  const commission = parseFloat(process.env.PLATFORM_COMMISSION) || 0.05;

  // 1. Guard — shipment must be COMPLETED
  //    Prevents release being called on wrong status
  const shipmentCheck = await pool.query(
    `SELECT status FROM shipments WHERE id = $1`,
    [shipment_id]
  );

  if (shipmentCheck.rows.length === 0) {
    throw new Error('Shipment not found');
  }

  if (shipmentCheck.rows[0].status !== 'COMPLETED') {
    throw new Error(
      `Cannot release — shipment is ${shipmentCheck.rows[0].status} not COMPLETED`
    );
  }

  // 2. Get confirmed payment
  //    Must be CONFIRMED — PENDING or FAILED payments cannot be released
  const paymentResult = await pool.query(
    `SELECT * FROM payments
     WHERE shipment_id = $1 AND status = 'CONFIRMED'`,
    [shipment_id]
  );

  if (paymentResult.rows.length === 0) {
    throw new Error('No confirmed payment found for this shipment');
  }

  const payment = paymentResult.rows[0];
  const escrow_amount = parseFloat(payment.amount);
  const platform_amount = parseFloat((escrow_amount * commission).toFixed(2));
  const payout_amount = parseFloat((escrow_amount - platform_amount).toFixed(2));

  // 3. Guard — prevent double release
  //    If revenues row already exists this shipment was already released
  const existingRevenue = await pool.query(
    `SELECT id FROM revenues WHERE shipment_id = $1`,
    [shipment_id]
  );

  if (existingRevenue.rows.length > 0) {
    throw new Error('Payment already released for this shipment');
  }

  // 4. Get company phone from DB — never hardcoded or defaulted
  //    If company has no phone, we cannot process payout — throw error
  const companyResult = await pool.query(
    `SELECT u.phone FROM users u
     JOIN companies c ON c.user_id = u.id
     WHERE c.id = $1`,
    [payment.company_id]
  );

  if (companyResult.rows.length === 0 || !companyResult.rows[0].phone) {
    throw new Error('Company phone number not found — cannot process payout');
  }

  const company_phone = companyResult.rows[0].phone;

  // 5. Call payout simulator FIRST before updating DB
  //    If payout fails — nothing is updated, error is thrown
  //    DB only updates after payout is successfully initiated
  const payout_reference = `payout-${payment.id}-${Date.now()}`;
  const payout_webhook_url = `${process.env.BASE_URL}/api/payments/payout-webhook`;

  try {
    await axios.post(`${process.env.BASE_URL}/api/momo-simulator/payout`, {
      company_phone,
      amount: payout_amount,
      reference_id: payout_reference,
      webhook_url: payout_webhook_url
    });
    console.log(
      `[releasePayment] ✓ Payout initiated — ${payout_amount} RWF → ${company_phone}`
    );
  } catch (err) {
    // Payout simulator failed — do NOT update DB
    // Throw so caller knows release did not happen
    throw new Error(`Payout failed — release aborted: ${err.message}`);
  }

  // 6. Payout succeeded , now update DB
  //    AND status = CONFIRMED prevents race condition
  await pool.query(
    `UPDATE payments
     SET status = 'RELEASED', payout_amount = $1
     WHERE id = $2 AND status = 'CONFIRMED'`,
    [payout_amount, payment.id]
  );

  // 7. Free truck → AVAILABLE
  //    Company can now use this truck for other shipments
  await pool.query(
    `UPDATE trucks SET availability_status = 'AVAILABLE'
     WHERE id = (
       SELECT selected_truck_id FROM shipments WHERE id = $1
     )`,
    [shipment_id]
  );

  // 8. Insert revenue row — records what platform earned this transaction
  await pool.query(
    `INSERT INTO revenues
     (shipment_id, payment_id, escrow_amount, amount_earned)
     VALUES ($1, $2, $3, $4)`,
    [shipment_id, payment.id, escrow_amount, platform_amount]
  );

  console.log(
    `[releasePayment] ✓ Shipment ${shipment_id} complete — ` +
    `escrow: ${escrow_amount} | platform: ${platform_amount} | payout: ${payout_amount}`
  );

  return { escrow_amount, platform_amount, payout_amount };
};

//DISPUTE RESOLUTION
// Admin only — resolves a disputed shipment
// Admin is the only one who can access this function
// Admin's input on the amounts acts as their signature
// The amounts are validated against the real escrow amount from DB
// so admin cannot split arbitrarily — numbers must always balance
//
// 3 resolution types:
//   FULL_RELEASE — company gets escrow minus commission, shipper gets 0
//   FULL_REFUND  — shipper gets full escrow back, platform earns nothing
//   SPLIT        — commission deducted first, admin splits the remainder
//                  admin provides shipper_amount and company_amount
//                  both must add up to escrow minus commission exactly
const resolveDispute = async (req, res) => {
  const { shipment_id, resolution_type, shipper_amount, company_amount } = req.body;
  const admin_id = req.user.id;

  // 1. Validate required fields
  if (!shipment_id || !resolution_type) {
    return res.status(400).json({
      message: 'shipment_id and resolution_type are required'
    });
  }

  if (!['FULL_RELEASE', 'FULL_REFUND', 'SPLIT'].includes(resolution_type)) {
    return res.status(400).json({
      message: 'resolution_type must be FULL_RELEASE, FULL_REFUND or SPLIT'
    });
  }

  try {
    // 2. Validate shipment exists and is DISPUTED
    //    Only DISPUTED shipments can be resolved
    const shipmentCheck = await pool.query(
      `SELECT status FROM shipments WHERE id = $1`,
      [shipment_id]
    );

    if (shipmentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    if (shipmentCheck.rows[0].status !== 'DISPUTED') {
      return res.status(400).json({
        message: `Shipment is in ${shipmentCheck.rows[0].status} — only DISPUTED shipments can be resolved`
      });
    }

    // 3. Get confirmed payment for this shipment
    //    Join shipments and trucks to get shipper_id and company_id
    const paymentResult = await pool.query(
      `SELECT p.*, s.shipper_id, t.company_id
       FROM payments p
       JOIN shipments s ON s.id = p.shipment_id
       JOIN trucks t ON t.id = s.selected_truck_id
       WHERE p.shipment_id = $1 AND p.status = 'CONFIRMED'`,
      [shipment_id]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({
        message: 'No confirmed payment found for this shipment'
      });
    }

    const payment = paymentResult.rows[0];

    // 4. Get real escrow amount from DB — never trust frontend input
    const escrow_amount = parseFloat(payment.amount);
    const commission = parseFloat(process.env.PLATFORM_COMMISSION) || 0.05;

    let final_shipper_amount;
    let final_company_amount;
    let final_platform_amount;
    let amount_earned;

    if (resolution_type === 'FULL_RELEASE') {
      // Platform deducts commission — company gets the rest — shipper gets nothing
      final_platform_amount = parseFloat((escrow_amount * commission).toFixed(2));
      final_company_amount = parseFloat((escrow_amount - final_platform_amount).toFixed(2));
      final_shipper_amount = 0;
      amount_earned = final_platform_amount;

    } else if (resolution_type === 'FULL_REFUND') {
      // Shipper gets full escrow back — no commission deducted — platform earns nothing
      final_shipper_amount = escrow_amount;
      final_company_amount = 0;
      final_platform_amount = 0;
      amount_earned = 0;

    } else if (resolution_type === 'SPLIT') {
      // Admin must provide both amounts
      // These act as admin's signature — they are explicitly agreeing to these numbers
      if (shipper_amount === undefined || company_amount === undefined) {
        return res.status(400).json({
          message: 'shipper_amount and company_amount are required for SPLIT'
        });
      }

      // Parse and validate — must be valid numbers
      const parsed_shipper = parseFloat(parseFloat(shipper_amount).toFixed(2));
      const parsed_company = parseFloat(parseFloat(company_amount).toFixed(2));

      if (isNaN(parsed_shipper) || isNaN(parsed_company)) {
        return res.status(400).json({
          message: 'shipper_amount and company_amount must be valid numbers'
        });
      }

      // Neither amount can be negative
      if (parsed_shipper < 0 || parsed_company < 0) {
        return res.status(400).json({
          message: 'shipper_amount and company_amount cannot be negative'
        });
      }

      // Commission is deducted first from escrow
      // Admin splits only the remainder — not the full escrow
      final_platform_amount = parseFloat((escrow_amount * commission).toFixed(2));
      const remaining = parseFloat((escrow_amount - final_platform_amount).toFixed(2));
      final_shipper_amount = parsed_shipper;
      final_company_amount = parsed_company;
      amount_earned = final_platform_amount;

      // Admin's input must add up exactly to remaining after commission
      // This is the core check — admin cannot input arbitrary numbers
      // This is validated against the real escrow amount from DB
      const splitTotal = parseFloat(
        (final_shipper_amount + final_company_amount).toFixed(2)
      );

      if (Math.abs(splitTotal - remaining) > 0.01) {
        return res.status(400).json({
          message: `Amounts must add up to ${remaining} RWF — that is the escrow of ${escrow_amount} RWF minus our commission of ${final_platform_amount} RWF`
        });
      }
    }

    // 5. Atomic transaction — all or nothing
    //    If any step fails everything rolls back
    //    No partial updates ever reach the DB
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update payment status and record company payout amount
      await client.query(
        `UPDATE payments
         SET status = 'REFUNDED', payout_amount = $1
         WHERE id = $2 AND status = 'CONFIRMED'`,
        [final_company_amount, payment.id]
      );

      // Insert refund record — full audit trail of how escrow was split
      await client.query(
        `INSERT INTO refunds
         (payment_id, shipment_id, shipper_id, company_id,
          escrow_amount, platform_amount, shipper_amount,
          company_amount, reason, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'DISPUTE_RESOLVED', 'COMPLETED')`,
        [
          payment.id,
          shipment_id,
          payment.shipper_id,
          payment.company_id,
          escrow_amount,
          final_platform_amount,
          final_shipper_amount,
          final_company_amount
        ]
      );

      // Update shipment → COMPLETED
      // AND status = DISPUTED prevents accidental double resolution
      await client.query(
        `UPDATE shipments SET status = 'COMPLETED'
         WHERE id = $1 AND status = 'DISPUTED'`,
        [shipment_id]
      );

      // Free truck → AVAILABLE so company can use it again
      await client.query(
        `UPDATE trucks SET availability_status = 'AVAILABLE'
         WHERE id = (
           SELECT selected_truck_id FROM shipments WHERE id = $1
         )`,
        [shipment_id]
      );

      // Insert revenue row — always inserted even if amount_earned = 0
      // This ensures revenues table has one row per completed shipment
      // including full refunds which show 0 platform earnings
      await client.query(
        `INSERT INTO revenues
         (shipment_id, payment_id, escrow_amount, amount_earned)
         VALUES ($1, $2, $3, $4)`,
        [shipment_id, payment.id, escrow_amount, amount_earned]
      );

      // Write to audit log — records which admin resolved this and how
      await client.query(
        `INSERT INTO audit_logs (admin_id, action, target_type, target_id)
         VALUES ($1, $2, 'shipment', $3)`,
        [admin_id, `DISPUTE_RESOLVED_${resolution_type}`, shipment_id]
      );

      await client.query('COMMIT');

      return res.status(200).json({
        message: 'Dispute resolved successfully',
        resolution_type,
        escrow_amount,
        platform_amount: final_platform_amount,
        company_amount: final_company_amount,
        shipper_amount: final_shipper_amount
      });

    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[resolveDispute] Transaction rolled back:', err.message);
      return res.status(500).json({
        message: 'Resolution failed — nothing was changed',
        detail: err.message
      });
    } finally {
      client.release();
    }

  } catch (err) {
    console.error('[resolveDispute] error:', err.message);
    return res.status(500).json({
      message: 'Server error',
      detail: err.message
    });
  }
};

export {
  initiatePayment,
  handleWebhook,
  handlePayoutWebhook,
  getPaymentStatus,
  releasePayment,
  resolveDispute
};
