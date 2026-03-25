import {
  createShipmentService,
  getMyShipmentsService,
  getShipmentInterestsService,
  selectTruckService,
  confirmShipmentService,
  disputeShipmentService,
  createRatingService
} from "../services/shipment_service.js";

import {
  initiatePayment,
  getPaymentStatus
} from "../controllers/payments.js";

export const createShipment = async (req, res) => {
  try {
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
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message });
  }
};

export const getMyShipments = async (req, res) => {
  try {
    const shipper_id = req.user.id;

    const shipments = await getMyShipmentsService(shipper_id);

    res.status(200).json(shipments);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message });
  }
};

export const getShipmentInterests = async (req, res) => {
  try {
    const { id } = req.params;
    const shipper_id = req.user.id;

    const interests = await getShipmentInterestsService(id, shipper_id);

    res.status(200).json(interests);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message });
  }
};

export const selectTruck = async (req, res) => {
  try {
    const { id } = req.params;
    const { truck_id } = req.body;
    const shipper_id = req.user.id;

    const shipment = await selectTruckService(id, truck_id, shipper_id);

    res.status(200).json(shipment);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message });
  }
};

export const confirmShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const shipper_id = req.user.id;

    const shipment = await confirmShipmentService(id, shipper_id);

    res.status(200).json(shipment);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message });
  }
};

export const disputeShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const shipper_id = req.user.id;

    const shipment = await disputeShipmentService(id, shipper_id);

    res.status(200).json(shipment);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message });
  }
};

export const createRating = async (req, res) => {
  try {
    const { shipment_id, stars, comment } = req.body;
    const shipper_id = req.user.id;

    const rating = await createRatingService(shipment_id, shipper_id, stars, comment);

    res.status(201).json(rating);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message });
  }
};

export { initiatePayment, getPaymentStatus };