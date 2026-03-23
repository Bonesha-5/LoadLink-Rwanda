import * as svc from "../service/shipments.js";
import { catchAsync } from "../utils/catchAsync.js";

export const postShipment = catchAsync(async (req, res) => {
  const shipment = await svc.createShipment(req.user.id, req.body);
  res.status(201).json(shipment);
});

export const myShipments = catchAsync(async (req, res) => {
  const shipments = await svc.getShipmentsByShipper(req.user.id);
  res.json(shipments);
});

export const getShipment = catchAsync(async (req, res) => {
  const shipment = await svc.getShipmentById(req.params.id);
  if (!shipment) return res.status(404).json({ message: "Shipment not found" });
  res.json(shipment);
});

export const allPosted = catchAsync(async (req, res) => {
  const shipments = await svc.getPostedShipments();
  res.json(shipments);
});

export const selectTruck = catchAsync(async (req, res) => {
  const shipment = await svc.selectTruck(req.params.id, req.body.truck_id, req.user.id);
  if (!shipment) return res.status(400).json({ message: "Cannot select truck for this shipment" });
  res.json(shipment);
});

export const confirmDelivery = catchAsync(async (req, res) => {
  const shipment = await svc.confirmDelivery(req.params.id, req.user.id);
  if (!shipment) return res.status(400).json({ message: "Cannot confirm this shipment" });
  res.json(shipment);
});

export const disputeDelivery = catchAsync(async (req, res) => {
  const shipment = await svc.disputeDelivery(req.params.id, req.user.id);
  if (!shipment) return res.status(400).json({ message: "Cannot dispute this shipment" });
  res.json(shipment);
});

export const getInterests = catchAsync(async (req, res) => {
  const trucks = await svc.getInterestsByShipment(req.params.id);
  res.json(trucks);
});

export const expressInterest = catchAsync(async (req, res) => {
  const interest = await svc.expressInterest(req.body.shipment_id, req.body.truck_id);
  res.status(201).json(interest ?? { message: "Already expressed interest" });
});

export const getTruckInfo = catchAsync(async (req, res) => {
  const info = await svc.getTruckInfoForShipment(req.params.id);
  if (!info) return res.status(404).json({ message: "Truck info not found" });
  res.json(info);
});

export const markPickup = catchAsync(async (req, res) => {
  const shipment = await svc.markPickup(req.params.id, req.user.company_id);
  if (!shipment) return res.status(400).json({ message: "Cannot mark pickup" });
  res.json(shipment);
});

export const markDelivery = catchAsync(async (req, res) => {
  const shipment = await svc.markDelivery(req.params.id, req.user.company_id);
  if (!shipment) return res.status(400).json({ message: "Cannot mark delivery" });
  res.json(shipment);
});
