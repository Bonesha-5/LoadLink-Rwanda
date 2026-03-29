import pool from "../config/db.js";

// Create a new interest for a shipment
export const createInterest = async (shipmentId, truckId, companyId) => {
  // 1. Verify truck belongs to company and is AVAILABLE
  const truckCheck = await pool.query(
    "SELECT id FROM trucks WHERE id = $1 AND company_id = $2 AND availability_status = 'AVAILABLE'",
    [truckId, companyId],
  );

  if (truckCheck.rows.length === 0) {
    throw new Error("Truck not found, does not belong to your company, or is not AVAILABLE");
  }

  // 2. Verify shipment is POSTED
  const shipmentCheck = await pool.query(
    "SELECT id FROM shipments WHERE id = $1 AND status = 'POSTED'",
    [shipmentId],
  );

  if (shipmentCheck.rows.length === 0) {
    throw new Error("Shipment not found or is no longer POSTED");
  }

  try {
    // 3. Insert into shipment_interests
   const result = await pool.query(
  `INSERT INTO shipment_interests (shipment_id, truck_id)
   VALUES ($1, $2)
   RETURNING *`,
  [shipmentId, truckId],
);

    return result.rows[0];
  } catch (error) {
    if (error.code === "23505") {
      // Unique violation
      throw new Error("You have already expressed interest in this shipment with this truck");
    }
    throw error;
  }
};
// Fetch all interests for a company
export const getMyInterests = async (companyId) => {
  const query = `
  SELECT i.id AS interest_id, i.created_at AS interest_date,
         s.id AS shipment_id, s.pickup_district, s.dropoff_district,
         s.cargo_description, s.weight, s.offered_price, s.pickup_date,
         s.status AS shipment_status,
         t.id AS truck_id, t.plate_number, t.declared_capacity
  FROM shipment_interests i
  JOIN shipments s ON i.shipment_id = s.id
  JOIN trucks t ON i.truck_id = t.id
  WHERE t.company_id = $1
  ORDER BY i.created_at DESC;
`;

  const result = await pool.query(query, [companyId]);
  return result.rows;
};

// Fetch all interests for a shipment (for the Shipper to see who is interested)
export const getShipmentInterestsService = async (shipment_id, shipper_id) => {
  const ownerCheck = await pool.query(
    `SELECT id FROM shipments WHERE id = $1 AND shipper_id = $2`,
    [shipment_id, shipper_id],
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

  const result = await pool.query(query, [shipment_id]);
  return result.rows;
};
