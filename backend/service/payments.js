import pool from "../config/db.js";

export const initiatePayment = async (shipment_id, shipper_id, provider, phone) => {
  // Verify shipment belongs to shipper and is in AWAITING_ESCROW
  const shipResult = await pool.query(
    `SELECT * FROM shipments WHERE id = $1 AND shipper_id = $2 AND status = 'AWAITING_ESCROW'`,
    [shipment_id, shipper_id]
  );
  const shipment = shipResult.rows[0];
  if (!shipment) throw new Error("Shipment not eligible for payment");

  // Create pending payment record
  const payResult = await pool.query(
    `INSERT INTO payments (shipment_id, amount, provider_reference, status)
     VALUES ($1, $2, $3, 'PENDING') RETURNING *`,
    [shipment.id, shipment.offered_price, `${provider}-${phone}-${Date.now()}`]
  );
  return { payment: payResult.rows[0], status: "PENDING" };
};

export const confirmPayment = async (payment_id) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const payResult = await client.query(
      `UPDATE payments SET status = 'CONFIRMED' WHERE id = $1 RETURNING *`,
      [payment_id]
    );
    const payment = payResult.rows[0];
    if (!payment) throw new Error("Payment not found");

    await client.query(
      `UPDATE shipments SET status = 'ESCROW_FUNDED' WHERE id = $1`,
      [payment.shipment_id]
    );
    await client.query("COMMIT");
    return payment;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const getPaymentsByShipper = async (shipper_id) => {
  const result = await pool.query(
    `SELECT p.*, s.pickup_district, s.dropoff_district
     FROM payments p
     JOIN shipments s ON s.id = p.shipment_id
     WHERE s.shipper_id = $1
     ORDER BY p.created_at DESC`,
    [shipper_id]
  );
  return result.rows;
};

export const getPaymentByShipment = async (shipment_id) => {
  const result = await pool.query(
    `SELECT * FROM payments WHERE shipment_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [shipment_id]
  );
  return result.rows[0];
};
