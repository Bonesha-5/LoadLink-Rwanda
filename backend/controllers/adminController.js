import pool from '../config/db.js';

export const getPendingCompanies = async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT
        c.name,
        c.rdb_number,
        c.contact_person,
        c.base_district,
        c.created_at,
        u.email
      FROM companies c
      JOIN users u ON u.id = c.user_id
      WHERE c.status = 'PENDING_VERIFICATION'
      ORDER BY c.created_at ASC
    `);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getCompanyDocs = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
      SELECT
        c.name,
        c.business_cert_path,
        c.insurance_doc_path
      FROM companies c
      WHERE c.id = $1
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Company not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const approveCompany = async (req, res) => {
    const { id } = req.params;
    const adminId = req.user.id;

    try {
        const company = await pool.query(
            `SELECT * FROM companies WHERE id = $1`, [id]
        );

        if (company.rows.length === 0) {
            return res.status(404).json({ message: 'Company not found' });
        }

        if (company.rows[0].status !== 'PENDING_VERIFICATION') {
            return res.status(400).json({ message: 'Company is not pending verification' });
        }

        await pool.query(
            `UPDATE companies SET status = 'VERIFIED' WHERE id = $1`, [id]
        );

        await pool.query(
            `UPDATE trucks SET availability_status = 'AVAILABLE' WHERE company_id = $1`, [id]
        );

        await pool.query(
            `INSERT INTO audit_logs (admin_id, action, target_type, target_id)
       VALUES ($1, 'COMPANY_APPROVED', 'company', $2)`,
            [adminId, id]
        );

        res.status(200).json({ message: 'Company approved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const rejectCompany = async (req, res) => {
    const { id } = req.params;
    const adminId = req.user.id;
    const { reason } = req.body || {};

    if (!reason || reason.trim() === '') {
        return res.status(400).json({ message: 'Rejection reason is required' });
    }

    try {
        const company = await pool.query(
            `SELECT * FROM companies WHERE id = $1`, [id]
        );

        if (company.rows.length === 0) {
            return res.status(404).json({ message: 'Company not found' });
        }

        if (company.rows[0].status !== 'PENDING_VERIFICATION') {
            return res.status(400).json({ message: 'Company is not pending verification' });
        }

        await pool.query(
            `UPDATE companies SET status = 'REJECTED' WHERE id = $1`, [id]
        );

        await pool.query(
            `INSERT INTO audit_logs (admin_id, action, target_type, target_id)
       VALUES ($1, 'COMPANY_REJECTED', 'company', $2)`,
            [adminId, id]
        );

        res.status(200).json({ message: 'Company rejected successfully', reason });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getAllShipments = async (req, res) => {
    const { status } = req.query;

    try {
        let query = `
      SELECT
        s.id,
        s.pickup_district,
        s.dropoff_district,
        s.weight,
        s.offered_price,
        s.status,
        s.pickup_date,
        s.created_at,
        u.name AS shipper_name,
        u.email AS shipper_email,
        t.plate_number AS truck_plate,
        c.name AS company_name
      FROM shipments s
      JOIN users u ON u.id = s.shipper_id
      LEFT JOIN trucks t ON t.id = s.selected_truck_id
      LEFT JOIN companies c ON c.id = t.company_id
    `;

        const values = [];

        if (status) {
            query += ` WHERE s.status = $1`;
            values.push(status);
        }

        query += ` ORDER BY s.created_at DESC`;

        const result = await pool.query(query, values);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getDisputes = async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT
        s.id AS shipment_id,
        s.pickup_district,
        s.dropoff_district,
        s.weight,
        s.offered_price,
        s.pickup_date,
        s.created_at,
        u.name AS shipper_name,
        u.email AS shipper_email,
        u.phone AS shipper_phone,
        t.plate_number AS truck_plate,
        t.truck_type,
        c.name AS company_name,
        c.contact_person AS company_contact,
        p.amount AS escrow_amount,
        p.status AS payment_status
      FROM shipments s
      JOIN users u ON u.id = s.shipper_id
      LEFT JOIN trucks t ON t.id = s.selected_truck_id
      LEFT JOIN companies c ON c.id = t.company_id
      LEFT JOIN payments p ON p.shipment_id = s.id
      WHERE s.status = 'DISPUTED'
      ORDER BY s.created_at ASC
    `);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const suspendUser = async (req, res) => {
    const { id } = req.params;
    const adminId = req.user.id;
    const { reason } = req.body || {};

    // Make reason mandatory
    if (!reason || reason.trim() === '') {
        return res.status(400).json({ message: 'Suspension reason is required' });
    }

    try {
        const user = await pool.query(
            `SELECT * FROM users WHERE id = $1`, [id]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.rows[0].is_suspended) {
            return res.status(400).json({ message: 'User is already suspended' });
        }

        await pool.query(
            `UPDATE users SET is_suspended = true WHERE id = $1`, [id]
        );

        await pool.query(
            `INSERT INTO audit_logs (admin_id, action, target_type, target_id)
       VALUES ($1, 'USER_SUSPENDED', 'user', $2)`,
            [adminId, id]
        );

        res.status(200).json({ message: 'User suspended successfully', reason });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const reinstateUser = async (req, res) => {
    const { id } = req.params;
    const adminId = req.user.id;

    try {
        // Check user exists
        const user = await pool.query(
            `SELECT * FROM users WHERE id = $1`, [id]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if already active
        if (!user.rows[0].is_suspended) {
            return res.status(400).json({ message: 'User is not suspended' });
        }

        // Reinstate user
        await pool.query(
            `UPDATE users SET is_suspended = false WHERE id = $1`, [id]
        );

        // Write to audit_logs
        await pool.query(
            `INSERT INTO audit_logs (admin_id, action, target_type, target_id)
       VALUES ($1, 'USER_REINSTATED', 'user', $2)`,
            [adminId, id]
        );

        res.status(200).json({ message: 'User reinstated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getAuditLog = async (req, res) => {
    const { admin_id } = req.query;

    try {
        let query = `
      SELECT
        a.id,
        a.action,
        a.target_type,
        a.target_id,
        a.created_at,
        u.name AS admin_name,
        u.email AS admin_email
      FROM audit_logs a
      JOIN users u ON u.id = a.admin_id
    `;

        const values = [];

        if (admin_id) {
            query += ` WHERE a.admin_id = $1`;
            values.push(admin_id);
        }

        query += ` ORDER BY a.created_at DESC`;

        const result = await pool.query(query, values);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};