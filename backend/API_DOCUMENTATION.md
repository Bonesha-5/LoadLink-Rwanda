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
Register a new logistics company.
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
Authenticate a company and receive a JWT token.
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
  - `200 OK`: Login successful. Returns `token` and `user` object.
  - `401 Unauthorized`: Invalid email or password.
  - `403 Forbidden`: Account suspended or pending verification.

---

---

## 2. Shippers API

### Register Shipper
Register a new shipper (individual or business looking to move cargo).
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
Authenticate a shipper.
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

### Get Available Shipments
Fetch shipments that are available for companies to express interest in.
- **Method:** `GET`
- **Path:** `/api/shipments/`
- **Auth Required:** Yes (Company Role)
- **Responses:**
  - `200 OK`: Returns a list of shipments.

### Get Active Shipments
Fetch ongoing shipments assigned to the company's trucks.
- **Method:** `GET`
- **Path:** `/api/shipments/active`
- **Auth Required:** Yes (Company Role)
- **Description:** Returns all shipments in `ESCROW_FUNDED`, `IN_TRANSIT`, or `AWAITING_CONFIRMATION` statuses. Includes full cargo details and **shipper contact information** (name, phone, email).
- **Responses:**
  - `200 OK`: Returns a list of active shipments.

### Pickup Shipment
Mark a shipment as picked up by a specific truck.
- **Method:** `PATCH`
- **Path:** `/api/shipments/:id/pickup`
- **Auth Required:** Yes (Company Role)
- **Body (JSON):**
```json
{
  "truckId": "123"
}
```
- **Responses:**
  - `200 OK`: Shipment picked up successfully.
  - `400 Bad Request`: Missing `truckId` or invalid ID format.

### Deliver Shipment
Mark a shipment as delivered.
- **Method:** `PATCH`
- **Path:** `/api/shipments/:id/deliver`
- **Auth Required:** Yes (Company Role)
- **Body (JSON):**
```json
{
  "truckId": "123"
}
```
- **Responses:**
  - `200 OK`: Shipment delivered successfully.

---

## 4. Trucks API

### Register Truck
Register a new truck for the company.
- **Method:** `POST`
- **Path:** `/api/trucks/register`
- **Auth Required:** Yes (Company Role)
- **Body (JSON):**
```json
{
  "plate_number": "RAB 123 A",
  "truck_type": "Flatbed",
  "declared_capacity": 15.5,
  "reg_card_path": "path/to/reg_card.pdf"
}
```
- **Responses:**
  - `201 Created`: Truck registered successfully.

### Get My Trucks
List all trucks belonging to the authenticated company.
- **Method:** `GET`
- **Path:** `/api/trucks/my`
- **Auth Required:** Yes (Company Role)
- **Responses:**
  - `200 OK`: List of trucks.

### Update Truck Status
Update the availability status of a truck.
- **Method:** `PATCH`
- **Path:** `/api/trucks/:id/status`
- **Auth Required:** Yes (Company Role)
- **Body (JSON):**
```json
{
  "availability_status": "AVAILABLE"
}
```
*Valid statuses: `AVAILABLE`, `RESERVED`, `IN_TRANSIT`, `UNAVAILABLE`*
- **Responses:**
  - `200 OK`: Status updated.

---

## 5. Interests API

### Express Interest
Express interest in a shipment with a specific truck.
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
List all interests expressed by the company.
- **Method:** `GET`
- **Path:** `/api/interests/my`
- **Auth Required:** Yes (Company Role)
- **Responses:**
  - `200 OK`: List of interests.
