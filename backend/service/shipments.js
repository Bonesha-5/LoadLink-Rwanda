import pool from "../config/db.js";
import { releasePayment } from "../controllers/payments.js";
import { sendEmail } from "../utils/emailService.js";


// Fetch available shipments for a company based on truck capacity
export const getAvailableShipmentsForCompany = async (companyId) => {
  const query = `
    SELECT s.pickup_district, s.dropoff_district, s.cargo_description, 
           s.weight, s.offered_price, s.pickup_date
    FROM shipments s
    WHERE s.status = 'POSTED'
      AND EXISTS (
        SELECT 1 FROM trucks t 
        WHERE t.company_id = $1 
          AND t.declared_capacity >= s.weight
      )
    ORDER BY s.created_at DESC;
  `;

  const result = await pool.query(query, [companyId]);
  return result.rows;
};

// Create a new shipment (Shipper)
export const createShipmentService = async (
  shipper_id,
  pickup_district,
  dropoff_district,
  pickup_description,
  cargo_description,
  weight,
  offered_price,
  pickup_date
) => {
  const query = `
    INSERT INTO shipments (
      shipper_id,
      pickup_district,
      dropoff_district,
      pickup_description,
      cargo_description,
      weight,
      offered_price,
      pickup_date,
      status
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'POSTED')
    RETURNING *;
  `;

  const values = [
    shipper_id,
    pickup_district,
    dropoff_district,
    pickup_description,
    cargo_description,
    weight,
    offered_price,
    pickup_date
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// Get shipments for a specific shipper
export const getMyShipmentsService = async (shipper_id) => {
  const query = `
    SELECT *
    FROM shipments
    WHERE shipper_id = $1
    ORDER BY created_at DESC;
  `;

  const result = await pool.query(query, [shipper_id]);
  return result.rows;
};


// Pickup a shipment
export const pickupShipment = async (shipmentId, companyId, truckId) => {
  // Verify truck belongs to company
  const truckCheck = await pool.query(
    "SELECT id FROM trucks WHERE id = $1 AND company_id = $2",
    [truckId, companyId],
  );

  if (truckCheck.rows.length === 0) {
    throw new Error("Truck does not belong to your company");
  }

  // Update shipment status from ESCROW_FUNDED to IN_TRANSIT
  const result = await pool.query(
    `UPDATE shipments 
     SET status = 'IN_TRANSIT', selected_truck_id = $1 
     WHERE id = $2 AND status = 'ESCROW_FUNDED'
     RETURNING *`,
    [truckId, shipmentId],
  );

  if (result.rows.length === 0) {
    throw new Error(
      "Shipment not found or not in ESCROW_FUNDED status",
    );
  }

  return result.rows[0];
};

// Deliver a shipment
export const deliverShipment = async (shipmentId, companyId, truckId) => {
  // Verify truck belongs to company
  const truckCheck = await pool.query(
    "SELECT id FROM trucks WHERE id = $1 AND company_id = $2",
    [truckId, companyId],
  );
  if (truckCheck.rows.length === 0) {
    throw new Error("Truck does not belong to your company");
  }

  // Update shipment status from IN_TRANSIT to AWAITING_CONFIRMATION
  const result = await pool.query(
    `UPDATE shipments 
     SET status = 'AWAITING_CONFIRMATION', delivered_at = CURRENT_TIMESTAMP 
     WHERE id = $1 AND status = 'IN_TRANSIT' AND selected_truck_id = $2
     RETURNING *`,
    [shipmentId, truckId],
  );

  return result.rows[0];
};

// Fetch active shipments for a company
export const getActiveShipments = async (companyId) => {
  const query = `
    SELECT s.id AS shipment_id, s.pickup_district, s.dropoff_district, 
           s.pickup_description, s.cargo_description, s.weight, 
           s.offered_price, s.pickup_date, s.status AS shipment_status,
           u.name AS shipper_name, u.phone AS shipper_phone, u.email AS shipper_email,
           t.plate_number, t.truck_type
    FROM shipments s
    JOIN trucks t ON s.selected_truck_id = t.id
    JOIN users u ON s.shipper_id = u.id
    WHERE t.company_id = $1
      AND s.status IN ('ESCROW_FUNDED', 'IN_TRANSIT', 'AWAITING_CONFIRMATION')
    ORDER BY s.created_at DESC;
  `;

  const result = await pool.query(query, [companyId]);
  return result.rows;
};

// Select a truck for a shipment
export const selectTruckService = async (shipmentId, truckId, shipperId) => {
  const shipmentResult = await pool.query(
    `SELECT * FROM shipments WHERE id = $1 AND shipper_id = $2`,
    [shipmentId, shipperId]
  );

  const shipment = shipmentResult.rows[0];

  if (!shipment) {
    const err = new Error("Shipment not found");
    err.status = 404;
    throw err;
  }

  if (shipment.status !== "POSTED") {
    const err = new Error("Shipment must be in POSTED status to select a truck");
    err.status = 400;
    throw err;
  }

  const interestResult = await pool.query(
    `SELECT * FROM shipment_interests WHERE shipment_id = $1 AND truck_id = $2`,
    [shipmentId, truckId]
  );

  if (interestResult.rows.length === 0) {
    const err = new Error("This truck has not expressed interest in this shipment");
    err.status = 400;
    throw err;
  }

  const truckResult = await pool.query(
    `SELECT * FROM trucks WHERE id = $1`,
    [truckId]
  );

  const truck = truckResult.rows[0];

  if (!truck) {
    const err = new Error("Truck not found");
    err.status = 404;
    throw err;
  }

  if (truck.availability_status !== "AVAILABLE") {
    const err = new Error("Truck is not available");
    err.status = 400;
    throw err;
  }

  const updatedShipment = await pool.query(
    `UPDATE shipments
     SET status = 'AWAITING_ESCROW', selected_truck_id = $1
     WHERE id = $2
     RETURNING *`,
    [truckId, shipmentId]
  );

  await pool.query(
    `UPDATE trucks SET availability_status = 'RESERVED' WHERE id = $1`,
    [truckId]
  );

  return updatedShipment.rows[0];
};

// Confirm a shipment as delivered
export const confirmShipmentService = async (shipmentId, shipperId) => {
  const shipmentResult = await pool.query(
    `SELECT * FROM shipments WHERE id = $1 AND shipper_id = $2`,
    [shipmentId, shipperId]
  );

  const shipment = shipmentResult.rows[0];

  if (!shipment) {
    const err = new Error("Shipment not found");
    err.status = 404;
    throw err;
  }

  if (shipment.status !== "AWAITING_CONFIRMATION") {
    const err = new Error("Shipment must be in AWAITING_CONFIRMATION status to confirm");
    err.status = 400;
    throw err;
  }

  // Update shipment → COMPLETED
  const updatedShipmentResult = await pool.query(
    `UPDATE shipments
     SET status = 'COMPLETED'
     WHERE id = $1
     RETURNING *`,
    [shipmentId]
  );

  const updatedShipment = updatedShipmentResult.rows[0];

  // Trigger payment release
  await releasePayment(shipmentId);

  // Send completion email to both shipper and company
  try {
    const detailsQuery = `
      SELECT s.*, 
             u.email as shipper_email, u.name as shipper_name,
             c.name as company_name, cu.email as company_email
      FROM shipments s
      JOIN users u ON s.shipper_id = u.id
      JOIN trucks t ON s.selected_truck_id = t.id
      JOIN companies c ON t.company_id = c.id
      JOIN users cu ON c.user_id = cu.id
      WHERE s.id = $1
    `;
    const detailsResult = await pool.query(detailsQuery, [shipmentId]);
    const d = detailsResult.rows[0];

    if (d) {
        const emailData = {
            shipment_id: d.id,
            cargo_description: d.cargo_description,
            pickup_district: d.pickup_district,
            dropoff_district: d.dropoff_district,
            weight: d.weight,
            amount: d.offered_price,
            company_name: d.company_name
        };

        // Send to shipper
        await sendEmail(d.shipper_email, `Shipment #${d.id} Completed`, 'completion_receipt', emailData);
        // Send to company
        await sendEmail(d.company_email, `Shipment #${d.id} Completed`, 'completion_receipt', emailData);
    }
  } catch (emailError) {
    console.error('[ShipmentService] Failed to send completion emails:', emailError.message);
  }

  return updatedShipment;
};

// Dispute a shipment
export const disputeShipmentService = async (shipmentId, shipperId) => {
  const shipmentResult = await pool.query(
    `SELECT * FROM shipments WHERE id = $1 AND shipper_id = $2`,
    [shipmentId, shipperId]
  );

  const shipment = shipmentResult.rows[0];

  if (!shipment) {
    const err = new Error("Shipment not found");
    err.status = 404;
    throw err;
  }

  if (shipment.status !== "AWAITING_CONFIRMATION") {
    const err = new Error("Shipment must be in AWAITING_CONFIRMATION status to dispute");
    err.status = 400;
    throw err;
  }

  const updatedShipment = await pool.query(
    `UPDATE shipments
     SET status = 'DISPUTED'
     WHERE id = $1
     RETURNING *`,
    [shipmentId]
  );

  return updatedShipment.rows[0];
};

