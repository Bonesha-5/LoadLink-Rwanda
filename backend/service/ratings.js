import pool from "../config/db.js";

export const submitRating = async (shipment_id, shipper_id, truck_id, stars, comment) => {
  // Verify shipment is COMPLETED and belongs to shipper
  const shipResult = await pool.query(
    `SELECT * FROM shipments WHERE id = $1 AND shipper_id = $2 AND status = 'COMPLETED'`,
    [shipment_id, shipper_id]
  );
  if (!shipResult.rows[0]) throw new Error("Shipment not eligible for rating");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const ratingResult = await client.query(
      `INSERT INTO ratings (shipment_id, truck_id, stars, comment) VALUES ($1,$2,$3,$4) RETURNING *`,
      [shipment_id, truck_id, stars, comment || null]
    );

    // Recalculate truck average rating
    await client.query(
      `UPDATE trucks SET rating_average = (
         SELECT ROUND(AVG(stars)::numeric, 2) FROM ratings WHERE truck_id = $1
       ) WHERE id = $1`,
      [truck_id]
    );

    await client.query("COMMIT");
    return ratingResult.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
