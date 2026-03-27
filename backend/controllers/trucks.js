import * as trucksService from "../service/trucks.js";
import { catchAsync } from "../utils/catchAsync.js";

export const getMyTrucks = catchAsync(async (req, res) => {
  const { company_id } = req.user;

  const trucks = await trucksService.getMyTrucks(company_id);

  res.status(200).json({
    success: true,
    data: trucks,
  });
});

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

export const registerTruck = catchAsync(async (req, res) => {
  const { plate_number, truck_type, declared_capacity, reg_card_path } = req.body;
  const { company_id } = req.user;

  if (!plate_number || !truck_type || !declared_capacity) {
    return res.status(400).json({
      success: false,
      message: "plate_number, truck_type, and declared_capacity are required",
    });
  }

  const truck = await trucksService.registerTruck(company_id, {
    plate_number,
    truck_type,
    declared_capacity,
    reg_card_path,
  });

  res.status(201).json({
    success: true,
    message: "Truck registered successfully",
    data: truck,
  });
});

export const getTruckRatings = catchAsync(async (req, res) => {
  const { id } = req.params;

  const ratings = await trucksService.getTruckRatings(id);

  res.status(200).json({
    success: true,
    data: ratings,
  });
});