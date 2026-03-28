# LoadLink-Rwanda API Documentation

This document provides a clear guide to the LoadLink-Rwanda backend API endpoints.

## Base URL
`http://localhost:3000` (Local Development)

## Authentication
Most endpoints require a **Bearer Token** in the `Authorization` header.

**Header Format:**
`Authorization: Bearer <your_jwt_token>`

---

## 1. Company API

### Register Company
- **Method:** `POST`
- **Path:** `/api/company/register`
- **Auth Required:** No
- **Body (JSON):**
```json
{
  "email": "company@example.com",
  "password": "SecurePassword123",
  "name": "Express Logistics Rwanda",
  "rdb_number": "RDB-2024-001",
  "contact_person": "Jean Paul",
  "phone": "+250780000000",
  "base_district": "Kigali",
  "business_cert_path": "path/to/cert.pdf",
  "insurance_doc_path": "path/to/insurance.pdf"
}
```
- **Responses:**
  - `201 Created`: Successful registration.
  - `400 Bad Request`: Email or RDB number already registered.

### Company Login
- **Method:** `POST`
- **Path:** `/api/company/login`
- **Auth Required:** No
- **Body (JSON):**
```json
{
  "email": "company@example.com",
  "password": "SecurePassword123"
}
```
- **Responses:**
  - `200 OK`: Returns `token` and `user` object.
  - `401 Unauthorized`: Invalid email or password.
  - `403 Forbidden`: Account suspended or pending verification.

---

## 2. Shippers API

### Register Shipper
- **Method:** `POST`
- **Path:** `/api/shippers/register`
- **Auth Required:** No
- **Body (JSON):**
```json
{
  "name": "Jane Shipper",
  "phone": "+250781111111",
  "email": "jane@example.com",
  "password": "SecurePassword123"
}
```
- **Responses:**
  - `201 Created`: Returns `token` and `user` info.

### Shipper Login
- **Method:** `POST`
- **Path:** `/api/shippers/login`
- **Auth Required:** No
- **Body (JSON):**
```json
{
  "email": "jane@example.com",
  "password": "SecurePassword123"
}
```
- **Responses:**
  - `200 OK`: Returns `token` and `user` info.

---

## 3. Shipments API

### Create Shipment
- **Method:** `POST`
- **Path:** `/api/shipments`
- **Auth Required:** Yes (Shipper Role)
- **Body (JSON):**
```json
{
  "pickup_district": "Kigali",
  "dropoff_district": "Huye",
  "pickup_description": "Near Kimironko market",
  "cargo_description": "Electronics, fragile",
  "weight": 5,
  "offered_price": 50000,
  "pickup_date": "2026-04-01"
}
```
- **Responses:**
  - `201 Created`: Returns new shipment object.

### Get My Shipments (Shipper)
- **Method:** `GET`
- **Path:** `/api/shipments/my`
- **Auth Required:** Yes (Shipper Role)
- **Responses:**
  - `200 OK`: Returns list of shipments created by the logged-in shipper.

### List Available Shipments (Company)
- **Method:** `GET`
- **Path:** `/api/shipments`
- **Auth Required:** Yes (Company Role)
- **Responses:**
  - `200 OK`: Returns list of POSTED shipments available for the company's trucks.

### Get Active Shipments (Company)
- **Method:** `GET`
- **Path:** `/api/shipments/active`
- **Auth Required:** Yes (Company Role)
- **Responses:**
  - `200 OK`: Returns shipments currently being handled by the company (ESCROW_FUNDED, IN_TRANSIT, etc.).

### Pickup Shipment (Company)
- **Method:** `PATCH`
- **Path:** `/api/shipments/:id/pickup`
- **Auth Required:** Yes (Company Role)
- **Body (JSON):** `{"truckId": "123"}`
- **Responses:**
  - `200 OK`: Shipment status updated to IN_TRANSIT.

### Deliver Shipment (Company)
- **Method:** `PATCH`
- **Path:** `/api/shipments/:id/deliver`
- **Auth Required:** Yes (Company Role)
- **Body (JSON):** `{"truckId": "123"}`
- **Responses:**
  - `200 OK`: Shipment status updated to AWAITING_CONFIRMATION.

### Get Shipment Interests (Shipper)
- **Method:** `GET`
- **Path:** `/api/interests/shipment/:id`
- **Auth Required:** Yes (Shipper Role)
- **Responses:**
  - `200 OK`: Returns list of trucks that expressed interest in this shipment, sorted by rating.

### Select Truck (Shipper)

- **Method:** `PATCH`
- **Path:** `/api/shipments/:id/select`
- **Auth Required:** Yes (Shipper Role)
- **Body (JSON):** `{"truck_id": "123"}`
- **Responses:**
  - `200 OK`: Truck selected, shipment status updated.

### Confirm Delivery (Shipper)
- **Method:** `PATCH`
- **Path:** `/api/shipments/:id/confirm`
- **Auth Required:** Yes (Shipper Role)
- **Responses:**
  - `200 OK`: Shipment set to COMPLETED, payment released.

### Dispute Delivery (Shipper)
- **Method:** `PATCH`
- **Path:** `/api/shipments/:id/dispute`
- **Auth Required:** Yes (Shipper Role)
- **Responses:**
  - `200 OK`: Shipment set to DISPUTED for admin resolution.


---

## 4. Ratings API

### Rate a Truck
- **Method:** `POST`
- **Path:** `/api/ratings`
- **Auth Required:** Yes (Shipper Role)
- **Body (JSON):**
```json
{
  "shipment_id": "123",
  "stars": 5,
  "comment": "Excellent service!"
}
```
- **Responses:**
  - `201 Created`: Rating saved, truck average updated.
  - `400 Bad Request`: Shipment not COMPLETED or stars out of range.
  - `409 Conflict`: Already rated this shipment.

---

## 5. Trucks API


### Register Truck
- **Method:** `POST`
- **Path:** `/api/trucks/register`
- **Auth Required:** Yes (Company Role)
- **Content-Type:** `multipart/form-data`
- **Body (Form Data):**
  - `plate_number`: string
  - `truck_type`: string
  - `declared_capacity`: number
  - `reg_card`: file
  - `insurance_cert`: file
- **Responses:**
  - `201 Created`: Truck registered successfully.
  - `400 Bad Request`: Missing fields or files.

### Get My Trucks
- **Method:** `GET`
- **Path:** `/api/trucks/my`
- **Auth Required:** Yes (Company Role)
- **Responses:**
  - `200 OK`: Returns list of trucks with verification_status.

### Update Truck Status
- **Method:** `PATCH`
- **Path:** `/api/trucks/:id/status`
- **Auth Required:** Yes (Company Role)
- **Body (JSON):**
```json
{
  "availability_status": "AVAILABLE"
}
```
- **Responses:**
  - `200 OK`: Status updated.

### Get Truck Ratings
- **Method:** `GET`
- **Path:** `/api/trucks/:id/ratings`
- **Auth Required:** No (Public)
- **Responses:**
  - `200 OK`: Returns list of ratings with shipper name, stars, comment, date.
  - `404 Not Found`: Truck not found.

---

## 6. Interests API



### Express Interest
- **Method:** `POST`
- **Path:** `/api/interests`
- **Auth Required:** Yes (Company Role)
- **Body (JSON):**
```json
{
  "shipment_id": "1",
  "truck_id": "1"
}
```
- **Responses:**
  - `201 Created`: Interest recorded.

### Get My Interests
- **Method:** `GET`
- **Path:** `/api/interests/my`
- **Auth Required:** Yes (Company Role)
- **Responses:**
  - `200 OK`: List of interests.

---

## 7. Payments API



### Initiate Payment
- **Method:** `POST`
- **Path:** `/api/payments/initiate`
- **Auth Required:** Yes (Shipper Role)
- **Body (JSON):**
```json
{
  "shipment_id": "1",
  "provider": "MTN",
  "phone_number": "+250780000000"
}
```
- **Responses:**
  - `200 OK`: Returns `reference_id` and `status: PENDING`.

### Check Payment Status
- **Method:** `GET`
- **Path:** `/api/payments/status/:reference_id`
- **Auth Required:** Yes
- **Responses:**
  - `200 OK`: Returns current payment and shipment status.

### Resolve Dispute
- **Method:** `POST`
- **Path:** `/api/payments/disputes/resolve`
- **Auth Required:** Yes (Admin Role)
- **Body (JSON):**
```json
{
  "shipment_id": "1",
  "resolution_type": "SPLIT",
  "shipper_amount": 5000,
  "company_amount": 5000
}
```
- **Responses:**
  - `200 OK`: Dispute resolved.

---

## 8. MOMO Simulator (Dev Only)



### Simulate Payment Success
- **Method:** `POST`
- **Path:** `/api/momo-simulator/pay`
- **Body (JSON):**
```json
{
  "reference_id": "REF-123",
  "amount": 10000,
  "phone_number": "+25078...",
  "webhook_url": "http://localhost:3000/api/payments/webhook"
}
```

### Simulate Payment Failure
- **Method:** `POST`
- **Path:** `/api/momo-simulator/fail`
- **Body (JSON):**
```json
{
  "reference_id": "REF-123",
  "webhook_url": "http://localhost:3000/api/payments/webhook"
}
```

### Simulate Payout
- **Method:** `POST`
- **Path:** `/api/momo-simulator/payout`
- **Body (JSON):**
```json
{
  "company_phone": "+25078...",
  "amount": 10000,
  "reference_id": "REF-123",
  "webhook_url": "http://localhost:3000/api/payments/payout-webhook"
}
```