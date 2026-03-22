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

  if (result.rows.length === 0) {
    throw new Error(
      "Shipment not found, not in IN_TRANSIT status, or not assigned to this truck",
    );
  }

  return result.rows[0];
};
