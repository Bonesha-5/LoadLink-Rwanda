-- USERS TABLE
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  role VARCHAR(20) NOT NULL CHECK (role IN ('SHIPPER', 'COMPANY', 'ADMIN')),
  name VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_suspended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- COMPANIES TABLE
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  rdb_number VARCHAR(50) UNIQUE NOT NULL,
  contact_person VARCHAR(100),
  base_district VARCHAR(50),
  business_cert_path TEXT,
  insurance_doc_path TEXT,
  status VARCHAR(30) DEFAULT 'PENDING_VERIFICATION'
    CHECK (status IN ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- TRUCKS TABLE
CREATE TABLE trucks (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  plate_number VARCHAR(20) UNIQUE NOT NULL,
  truck_type VARCHAR(50),
  declared_capacity NUMERIC(10,2),
  reg_card_path TEXT,
  availability_status VARCHAR(20) DEFAULT 'UNAVAILABLE'
    CHECK (availability_status IN ('AVAILABLE', 'RESERVED', 'IN_TRANSIT', 'UNAVAILABLE')),
  rating_average NUMERIC(3,2) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SHIPMENTS TABLE
CREATE TABLE shipments (
  id SERIAL PRIMARY KEY,
  shipper_id INTEGER REFERENCES users(id),
  pickup_district VARCHAR(50),
  dropoff_district VARCHAR(50),
  pickup_description TEXT,
  weight NUMERIC(10,2),
  offered_price NUMERIC(12,2),
  pickup_date DATE,
  status VARCHAR(30) DEFAULT 'POSTED'
    CHECK (status IN (
      'POSTED','AWAITING_ESCROW','ESCROW_FUNDED',
      'IN_TRANSIT','AWAITING_CONFIRMATION','COMPLETED','DISPUTED'
    )),
  selected_truck_id INTEGER REFERENCES trucks(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- SHIPMENT INTERESTS TABLE
CREATE TABLE shipment_interests (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER REFERENCES shipments(id),
  truck_id INTEGER REFERENCES trucks(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(shipment_id, truck_id)
);

-- PAYMENTS TABLE
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER REFERENCES shipments(id),
  amount NUMERIC(12,2),
  provider_reference VARCHAR(100),
  status VARCHAR(20) DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','CONFIRMED','RELEASED','REFUNDED')),
  payout_amount NUMERIC(12,2),
  refund_amount NUMERIC(12,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- RATINGS TABLE
CREATE TABLE ratings (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER REFERENCES shipments(id),
  truck_id INTEGER REFERENCES trucks(id),
  stars INTEGER CHECK (stars BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AUDIT LOG TABLE (for admin traceability)
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES users(id),
  action VARCHAR(100),
  target_type VARCHAR(50),
  target_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);