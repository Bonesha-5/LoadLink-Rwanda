import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// Register a new shipper
export const registerShipper = async (name, phone, email, password) => {
  const hashedPassword = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `INSERT INTO users (name, phone, email, password_hash, role)
     VALUES ($1, $2, $3, $4, 'SHIPPER')
     RETURNING id, name, email, role`,
    [name, phone, email, hashedPassword],
  );

  const user = result.rows[0];

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "24h",
  });

  return { user, token };
};

// Login a shipper
export const loginShipper = async (email, password) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1 AND role = 'SHIPPER'`,
    [email],
  );

  const user = result.rows[0];

  if (!user) {
    throw new Error("User not found");
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "24h",
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

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
