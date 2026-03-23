import * as svc from "../service/payments.js";
import { catchAsync } from "../utils/catchAsync.js";

export const initiate = catchAsync(async (req, res) => {
  const { shipment_id, provider, phone } = req.body;
  const result = await svc.initiatePayment(shipment_id, req.user.id, provider, phone);
  res.status(201).json(result);
});

// Webhook — called by Mobile Money provider to confirm payment
export const webhook = catchAsync(async (req, res) => {
  const { payment_id } = req.body;
  const payment = await svc.confirmPayment(payment_id);
  res.json({ success: true, payment });
});

export const myPayments = catchAsync(async (req, res) => {
  const payments = await svc.getPaymentsByShipper(req.user.id);
  res.json(payments);
});

export const getByShipment = catchAsync(async (req, res) => {
  const payment = await svc.getPaymentByShipment(req.params.shipment_id);
  if (!payment) return res.status(404).json({ message: "No payment found" });
  res.json(payment);
});
