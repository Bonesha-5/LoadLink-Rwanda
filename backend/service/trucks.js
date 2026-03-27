import pool from "../config/db.js";

export const getMyTrucks = async (companyId) => {
  const query = `
    SELECT id, plate_number, truck_type, declared_capacity, 
           availability_status, rating_average, created_at
    FROM trucks
    WHERE company_id = $1
    ORDER BY plate_number ASC;
  `;

  const result = await pool.query(query, [companyId]);
  return result.rows;
};

export const updateTruckStatus = async (truckId, companyId, newStatus) => {
  const allowedStatuses = ["AVAILABLE", "UNAVAILABLE"];

  if (!allowedStatuses.includes(newStatus)) {
    throw new Error("Only AVAILABLE and UNAVAILABLE statuses can be set manually");
  }

  const truck = await pool.query(
    "SELECT availability_status FROM trucks WHERE id = $1 AND company_id = $2",
    [truckId, companyId]
  );

  if (truck.rows.length === 0) {
    throw new Error("Truck not found or does not belong to your company");
  }

  const currentStatus = truck.rows[0].availability_status;
  if (["RESERVED", "IN_TRANSIT"].includes(currentStatus)) {
    throw new Error(
      `Cannot manually change status while truck is ${currentStatus} (system-controlled)`
    );
  }

  const result = await pool.query(
    "UPDATE trucks SET availability_status = $1 WHERE id = $2 RETURNING *",
    [newStatus, truckId]
  );

  return result.rows[0];
};

export const registerTruck = async (companyId, truckData) => {
  const { plate_number, truck_type, declared_capacity, reg_card_path } = truckData;

  const existingTruck = await pool.query(
    "SELECT id FROM trucks WHERE plate_number = $1",
    [plate_number]
  );

  if (existingTruck.rows.length > 0) {
    throw new Error("Truck with this plate number is already registered");
  }

  const result = await pool.query(
    `INSERT INTO trucks (company_id, plate_number, truck_type, declared_capacity, reg_card_path, availability_status)
     VALUES ($1, $2, $3, $4, $5, 'UNAVAILABLE')
     RETURNING *`,
    [companyId, plate_number, truck_type, declared_capacity, reg_card_path]
  );

  return result.rows[0];
};

export const getTruckRatings = async (truckId) => {
  const truckCheck = await pool.query(
    "SELECT id FROM trucks WHERE id = $1",
    [truckId]
  );

  if (truckCheck.rows.length === 0) {
    const err = new Error("Truck not found");
    err.status = 404;
    throw err;
  }

  const result = await pool.query(
    `SELECT 
      r.stars,
      r.comment,
      r.created_at,
      u.name AS shipper_name
     FROM ratings r
     JOIN users u ON u.id = r.shipper_id
     WHERE r.truck_id = $1
     ORDER BY r.created_at DESC`,
    [truckId]
  );

  return result.rows;
};