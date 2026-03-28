import * as shipmentsService from "../service/shipments.js";
import {
  createShipmentService,
  getMyShipmentsService,
  selectTruckService,
  confirmShipmentService,
  disputeShipmentService,
} from "../service/shipments.js";

import { catchAsync } from "../utils/catchAsync.js";

// Fetch available shipments 
export const getAvailableShipments = catchAsync(async (req, res) => {
  const { company_id } = req.user;

  if (!company_id) {
    return res.status(400).json({
      success: false,
      message: "Company ID not found in token",
    });
  }

  const shipments = await shipmentsService.getAvailableShipmentsForCompany(company_id);

  res.status(200).json({
    success: true,
    data: shipments,
  });
});

// Create a new shipment (Shipper)
export const createShipment = catchAsync(async (req, res) => {
  const {
    pickup_district,
    dropoff_district,
    pickup_description,
    cargo_description,
    weight,
    offered_price,
    pickup_date
  } = req.body;

  const shipper_id = req.user.id;

  const shipment = await createShipmentService(
    shipper_id,
    pickup_district,
    dropoff_district,
    pickup_description,
    cargo_description,
    weight,
    offered_price,
    pickup_date
  );

  res.status(201).json(shipment);
});

// Get shipments for the logged-in shipper
export const getMyShipments = catchAsync(async (req, res) => {
  const shipper_id = req.user.id;

  const shipments = await getMyShipmentsService(shipper_id);

  res.status(200).json(shipments);
});


// Pickup a shipment
export const pickupShipment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { truckId } = req.body;
  const { company_id } = req.user;

  if (!truckId) {
    return res.status(400).json({
      success: false,
      message: "truckId is required",
    });
  }

  // Validation: Ensure id and truckId are valid integers
  if (isNaN(id) || parseInt(id).toString() !== id.toString()) {
    const error = new Error("Invalid shipment ID format");
    error.statusCode = 400;
    throw error;
  }

  if (isNaN(truckId) || parseInt(truckId).toString() !== truckId.toString()) {
    const error = new Error("Invalid truck ID format");
    error.statusCode = 400;
    throw error;
  }

  await shipmentsService.pickupShipment(id, company_id, truckId);

  res.status(200).json({
    success: true,
    message: "Shipment picked up successfully",
  });
});

// Deliver a shipment
export const deliverShipment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { truckId } = req.body;
  const { company_id } = req.user;

  if (!truckId) {
    return res.status(400).json({
      success: false,
      message: "truckId is required",
    });
  }

  // Validation: Ensure id and truckId are valid integers
  if (isNaN(id) || parseInt(id).toString() !== id.toString()) {
    const error = new Error("Invalid shipment ID format");
    error.statusCode = 400;
    throw error;
  }

  if (isNaN(truckId) || parseInt(truckId).toString() !== truckId.toString()) {
    const error = new Error("Invalid truck ID format");
    error.statusCode = 400;
    throw error;
  }

  await shipmentsService.deliverShipment(id, company_id, truckId);

  res.status(200).json({
    success: true,
    message: "Shipment delivered successfully",
  });
});

// Fetch active shipments for the logged-in company
export const getActiveShipments = catchAsync(async (req, res) => {
  const { company_id } = req.user;

  const shipments = await shipmentsService.getActiveShipments(company_id);

  res.status(200).json({
    success: true,
    data: shipments,
  });
});

// Select a truck for a shipment
export const selectTruck = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { truck_id } = req.body;
  const shipper_id = req.user.id;

  const shipment = await selectTruckService(id, truck_id, shipper_id);

  res.status(200).json(shipment);
});

// Confirm a shipment as delivered (Shipper)
export const confirmShipment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const shipper_id = req.user.id;

  const shipment = await confirmShipmentService(id, shipper_id);

  res.status(200).json(shipment);
});

// Dispute a shipment (Shipper)
export const disputeShipment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const shipper_id = req.user.id;

  const shipment = await disputeShipmentService(id, shipper_id);

  res.status(200).json(shipment);
});

