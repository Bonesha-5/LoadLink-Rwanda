import pool from "../config/db.js";

export const createShipment = async (shipper_id, data) => {
  const { pickup_district, dropoff_district, pickup_description, cargo_description, weight, offered_price, pickup_date } = data;
  const result = await pool.query(
    `INSERT INTO shipments (shipper_id, pickup_district, dropoff_district, pickup_description, cargo_description, weight, offered_price, pickup_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [shipper_id, pickup_district, dropoff_district, pickup_description, cargo_description, weight, offered_price, pickup_date]
  );
  return result.rows[0];
};

export const getShipmentsByShipper = async (shipper_id) => {
  const result = await pool.query(
    `SELECT s.*,
       EXISTS(SELECT 1 FROM ratings r WHERE r.shipment_id = s.id) AS has_rating
     FROM shipments s WHERE s.shipper_id = $1 ORDER BY s.created_at DESC`,
    [shipper_id]
  );
  return result.rows;
};

export const getShipmentById = async (id) => {
  const result = await pool.query(`SELECT * FROM shipments WHERE id = $1`, [id]);
  return result.rows[0];
};

export const getPostedShipments = async () => {
  const result = await pool.query(
    `SELECT * FROM shipments WHERE status = 'POSTED' ORDER BY created_at DESC`
  );
  return result.rows;
};

export const selectTruck = async (shipment_id, truck_id, shipper_id) => {
  const result = await pool.query(
    `UPDATE shipments SET selected_truck_id = $1, status = 'AWAITING_ESCROW'
     WHERE id = $2 AND shipper_id = $3 AND status = 'POSTED' RETURNING *`,
    [truck_id, shipment_id, shipper_id]
  );
  return result.rows[0];
};

export const confirmDelivery = async (shipment_id, shipper_id) => {
  const result = await pool.query(
    `UPDATE shipments SET status = 'COMPLETED'
     WHERE id = $1 AND shipper_id = $2 AND status = 'AWAITING_CONFIRMATION' RETURNING *`,
    [shipment_id, shipper_id]
  );
  return result.rows[0];
};

export const disputeDelivery = async (shipment_id, shipper_id) => {
  const result = await pool.query(
    `UPDATE shipments SET status = 'DISPUTED'
     WHERE id = $1 AND shipper_id = $2 AND status = 'AWAITING_CONFIRMATION' RETURNING *`,
    [shipment_id, shipper_id]
  );
  return result.rows[0];
};

export const getInterestsByShipment = async (shipment_id) => {
  const result = await pool.query(
    `SELECT t.id, t.plate_number, t.truck_type, t.declared_capacity, t.rating_average,
            c.name AS company_name, c.contact_person
     FROM shipment_interests si
     JOIN trucks t ON t.id = si.truck_id
     JOIN companies c ON c.id = t.company_id
     WHERE si.shipment_id = $1
     ORDER BY t.rating_average DESC NULLS LAST`,
    [shipment_id]
  );
  return result.rows;
};

export const expressInterest = async (shipment_id, truck_id) => {
  const result = await pool.query(
    `INSERT INTO shipment_interests (shipment_id, truck_id) VALUES ($1, $2)
     ON CONFLICT (shipment_id, truck_id) DO NOTHING RETURNING *`,
    [shipment_id, truck_id]
  );
  return result.rows[0];
};

export const getTruckInfoForShipment = async (shipment_id) => {
  const result = await pool.query(
    `SELECT t.id AS truck_id, t.plate_number, c.name AS company_name
     FROM shipments s
     JOIN trucks t ON t.id = s.selected_truck_id
     JOIN companies c ON c.id = t.company_id
     WHERE s.id = $1`,
    [shipment_id]
  );
  return result.rows[0];
};

export const markPickup = async (shipment_id, company_id) => {
  const result = await pool.query(
    `UPDATE shipments SET status = 'IN_TRANSIT'
     WHERE id = $1 AND status = 'ESCROW_FUNDED'
       AND selected_truck_id IN (SELECT id FROM trucks WHERE company_id = $2)
     RETURNING *`,
    [shipment_id, company_id]
  );
  return result.rows[0];
};

export const markDelivery = async (shipment_id, company_id) => {
  const result = await pool.query(
    `UPDATE shipments SET status = 'AWAITING_CONFIRMATION', delivery_timestamp = NOW()
     WHERE id = $1 AND status = 'IN_TRANSIT'
       AND selected_truck_id IN (SELECT id FROM trucks WHERE company_id = $2)
     RETURNING *`,
    [shipment_id, company_id]
  );
  return result.rows[0];
};
