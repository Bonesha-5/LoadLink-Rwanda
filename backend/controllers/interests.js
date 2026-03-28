import * as interestsService from "../service/interests.js";
import { getShipmentInterestsService } from "../service/interests.js";

import { catchAsync } from "../utils/catchAsync.js";

// Handle creating a new interest
export const createInterest = catchAsync(async (req, res) => {
  const { shipment_id, truck_id } = req.body;
  const { company_id } = req.user;

  if (!shipment_id || !truck_id) {
    return res.status(400).json({
      success: false,
      message: "shipment_id and truck_id are required",
    });
  }

  const interest = await interestsService.createInterest(shipment_id, truck_id, company_id);

  res.status(201).json({
    success: true,
    message: "Interest expressed successfully",
    data: interest,
  });
});

// Fetch all interests for the logged in company
export const getMyInterests = catchAsync(async (req, res) => {
  const { company_id } = req.user;

  const interests = await interestsService.getMyInterests(company_id);

  res.status(200).json({
    success: true,
    data: interests,
  });
});

// Fetch all interests for a shipment
export const getShipmentInterests = catchAsync(async (req, res) => {
  const { id } = req.params;
  const shipper_id = req.user.id;

  const interests = await getShipmentInterestsService(id, shipper_id);

  res.status(200).json(interests);
});

