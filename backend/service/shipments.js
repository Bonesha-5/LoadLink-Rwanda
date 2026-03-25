import pool from "../config/db.js";

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
