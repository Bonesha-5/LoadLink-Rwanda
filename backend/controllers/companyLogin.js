const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const CompanyLogin = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: 'No body received' });
  }

  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT u.id AS user_id, u.email, u.password_hash, u.role, u.is_suspended, c.id AS company_id, c.name AS company_name, c.status AS company_status, c.base_district, c.contact_person FROM users u JOIN companies c ON c.user_id = u.id WHERE u.email = $1 AND u.role = $2',
      [email, 'COMPANY']
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (user.is_suspended) {
      return res.status(403).json({ message: 'Account has been suspended' });
    }

    if (user.company_status === 'PENDING_VERIFICATION') {
      return res.status(403).json({ message: 'Account pending admin verification' });
    }

    if (user.company_status === 'REJECTED') {
      return res.status(403).json({ message: 'Account rejected' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.user_id, role: user.role, company_id: user.company_id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
        company_name: user.company_name,
        contact_person: user.contact_person,
        status: user.company_status,
      }
    });

  } catch (err) {
    console.error('Company login error:', err.message);
    return res.status(500).json({ message: 'Server error', detail: err.message });
  }
};

module.exports = { CompanyLogin };
