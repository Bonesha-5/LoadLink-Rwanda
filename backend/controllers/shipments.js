import * as shipmentsService from "../service/shipments.js";
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
