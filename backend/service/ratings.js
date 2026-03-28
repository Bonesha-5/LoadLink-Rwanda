import pool from "../config/db.js";

// Create a rating for a completed shipment
export const createRatingService = async (shipmentId, shipperId, stars, comment) => {
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

  const existingRating = await pool.query(
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

  const ratingResult = await pool.query(
    `INSERT INTO ratings (shipment_id, truck_id, shipper_id, stars, comment)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [shipmentId, truck_id, shipperId, stars, comment || null]
  );

  // Update truck's average rating
  await pool.query(
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
