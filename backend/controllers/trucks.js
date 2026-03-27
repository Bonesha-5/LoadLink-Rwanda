import * as trucksService from "../service/trucks.js";
import { catchAsync } from "../utils/catchAsync.js";

// Handle fetching all trucks for the logged-in company
export const getMyTrucks = catchAsync(async (req, res) => {
  const { company_id } = req.user;

  const trucks = await trucksService.getMyTrucks(company_id);

  res.status(200).json({
    success: true,
    data: trucks,
  });
});

// Update truck availability status
export const updateTruckStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { availability_status } = req.body;
  const { company_id } = req.user;

  if (!availability_status) {
    return res.status(400).json({
      success: false,
      message: "availability_status is required",
    });
  }

  const truck = await trucksService.updateTruckStatus(id, company_id, availability_status);

  res.status(200).json({
    success: true,
    message: "Truck status updated successfully",
    data: truck,
  });
});

// Register a new truck
export const registerTruck = catchAsync(async (req, res) => {
  const { plate_number, truck_type, declared_capacity } = req.body;
  const { company_id } = req.user;

  if (!plate_number || !truck_type || !declared_capacity) {
    return res.status(400).json({
      success: false,
      message: "plate_number, truck_type, and declared_capacity are required",
    });
  }

  // Extract file paths from req.files
  const reg_card_path = req.files?.["reg_card"]?.[0]?.path;
  const insurance_cert_path = req.files?.["insurance_cert"]?.[0]?.path;

  if (!reg_card_path || !insurance_cert_path) {
    return res.status(400).json({
      success: false,
      message: "Both registration card and insurance certificate are required",
    });
  }

  const truck = await trucksService.registerTruck(company_id, {
    plate_number,
    truck_type,
    declared_capacity,
    reg_card_path,
    insurance_cert_path,
  });

  res.status(201).json({
    success: true,
    message: "Truck registered successfully",
    data: truck,
  });
});
