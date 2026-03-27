import pool from "../config/db.js";

// Fetch all trucks for a company
export const getMyTrucks = async (companyId) => {
  const query = `
    SELECT id, plate_number, truck_type, declared_capacity, 
           availability_status, verification_status, reg_card_path, insurance_cert_path,
           rating_average, created_at
    FROM trucks
    WHERE company_id = $1
    ORDER BY plate_number ASC;
  `;

  const result = await pool.query(query, [companyId]);
  return result.rows;
};
// Update truck status (manual toggle)
export const updateTruckStatus = async (truckId, companyId, newStatus) => {
  const allowedStatuses = ["AVAILABLE", "UNAVAILABLE"];

  if (!allowedStatuses.includes(newStatus)) {
    throw new Error("Only AVAILABLE and UNAVAILABLE statuses can be set manually");
  }

  // 1. Check if truck exists ands belongs to company
  const truck = await pool.query(
    "SELECT availability_status FROM trucks WHERE id = $1 AND company_id = $2",
    [truckId, companyId],
  );

  if (truck.rows.length === 0) {
    throw new Error("Truck not found or does not belong to your company");
  }

  const currentStatus = truck.rows[0].availability_status;
  if (["RESERVED", "IN_TRANSIT"].includes(currentStatus)) {
    throw new Error(
      `Cannot manually change status while truck is ${currentStatus} (system-controlled)`,
    );
  }

  // 2. Update status
  const result = await pool.query(
    "UPDATE trucks SET availability_status = $1 WHERE id = $2 RETURNING *",
    [newStatus, truckId],
  );

  return result.rows[0];
};

// Register a new truck
export const registerTruck = async (companyId, truckData) => {
  const { plate_number, truck_type, declared_capacity, reg_card_path, insurance_cert_path } =
    truckData;

  // Check if plate_number already exists
  const existingTruck = await pool.query(
    "SELECT id FROM trucks WHERE plate_number = $1",
    [plate_number],
  );
  if (existingTruck.rows.length > 0) {
    throw new Error("Truck with this plate number is already registered");
  }

  const result = await pool.query(
    `INSERT INTO trucks (company_id, plate_number, truck_type, declared_capacity, reg_card_path, insurance_cert_path, availability_status, verification_status)
     VALUES ($1, $2, $3, $4, $5, $6, 'UNAVAILABLE', 'PENDING')
     RETURNING *`,
    [companyId, plate_number, truck_type, declared_capacity, reg_card_path, insurance_cert_path],
  );

  return result.rows[0];
};
