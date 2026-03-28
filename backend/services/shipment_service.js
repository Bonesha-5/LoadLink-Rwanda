import db from "../config/db.js";
import { releasePayment } from "../controllers/payments.js";

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

  const result = await db.query(query, values);
  return result.rows[0];
};

export const getMyShipmentsService = async (shipper_id) => {
  const query = `
    SELECT *
    FROM shipments
    WHERE shipper_id = $1
    ORDER BY created_at DESC;
  `;

  const result = await db.query(query, [shipper_id]);
  return result.rows;
};

export const getShipmentInterestsService = async (shipment_id, shipper_id) => {
  const ownerCheck = await db.query(
    `SELECT id FROM shipments WHERE id = $1 AND shipper_id = $2`,
    [shipment_id, shipper_id]
  );

  if (ownerCheck.rows.length === 0) {
    const err = new Error("Shipment not found");
    err.status = 404;
    throw err;
  }

  const query = `
    SELECT 
      t.id,
      t.plate_number,
      t.truck_type,
      t.declared_capacity,
      t.rating_average,
      c.name AS company_name,
      c.contact_person
    FROM shipment_interests si
    JOIN trucks t ON si.truck_id = t.id
    JOIN companies c ON t.company_id = c.id
    WHERE si.shipment_id = $1
    ORDER BY t.rating_average DESC, si.created_at ASC;
  `;

  const result = await db.query(query, [shipment_id]);
  return result.rows;
};

export const selectTruckService = async (shipmentId, truckId, shipperId) => {
  const shipmentResult = await db.query(
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

  const interestResult = await db.query(
    `SELECT * FROM shipment_interests WHERE shipment_id = $1 AND truck_id = $2`,
    [shipmentId, truckId]
  );

  if (interestResult.rows.length === 0) {
    const err = new Error("This truck has not expressed interest in this shipment");
    err.status = 400;
    throw err;
  }

  const truckResult = await db.query(
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

  const updatedShipment = await db.query(
    `UPDATE shipments
     SET status = 'AWAITING_ESCROW', selected_truck_id = $1
     WHERE id = $2
     RETURNING *`,
    [truckId, shipmentId]
  );

  await db.query(
    `UPDATE trucks SET availability_status = 'RESERVED' WHERE id = $1`,
    [truckId]
  );

  return updatedShipment.rows[0];
};

export const confirmShipmentService = async (shipmentId, shipperId) => {
  const shipmentResult = await db.query(
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
  const updatedShipment = await db.query(
    `UPDATE shipments
     SET status = 'COMPLETED'
     WHERE id = $1
     RETURNING *`,
    [shipmentId]
  );

  // Trigger payment release — Annie's logic
  await releasePayment(shipmentId);

  return updatedShipment.rows[0];
};

export const disputeShipmentService = async (shipmentId, shipperId) => {
  const shipmentResult = await db.query(
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

  const updatedShipment = await db.query(
    `UPDATE shipments
     SET status = 'DISPUTED'
     WHERE id = $1
     RETURNING *`,
    [shipmentId]
  );

  return updatedShipment.rows[0];
};

export const createRatingService = async (shipmentId, shipperId, stars, comment) => {
  const shipmentResult = await db.query(
    `SELECT * FROM shipments WHERE id = $1 AND shipper_id = $2`,
    [shipmentId, shipperId]
  );

  const shipment = shipmentResult.rows[0];

  if (!shipment) {
    const err = new Error("Shipment not found");
    err.status = 404;
    throw err;
  }

  if (shipment.status !== "COMPLETED") {
    const err = new Error("Shipment must be COMPLETED before rating");
    err.status = 400;
    throw err;
  }

  if (!shipment.selected_truck_id) {
    const err = new Error("No truck assigned to this shipment");
    err.status = 400;
    throw err;
  }

  const truck_id = shipment.selected_truck_id;

  const existingRating = await db.query(
    `SELECT id FROM ratings WHERE shipment_id = $1 AND truck_id = $2`,
    [shipmentId, truck_id]
  );

  if (existingRating.rows.length > 0) {
    const err = new Error("You have already rated this shipment");
    err.status = 409;
    throw err;
  }

  if (stars < 1 || stars > 5) {
    const err = new Error("Stars must be between 1 and 5");
    err.status = 400;
    throw err;
  }

  const ratingResult = await db.query(
    `INSERT INTO ratings (shipment_id, truck_id, shipper_id, stars, comment)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [shipmentId, truck_id, shipperId, stars, comment || null]
  );

  await db.query(
    `UPDATE trucks
     SET rating_average = (
       SELECT ROUND(AVG(stars)::numeric, 2)
       FROM ratings
       WHERE truck_id = $1
     )
     WHERE id = $1`,
    [truck_id]
  );

  return ratingResult.rows[0];
};