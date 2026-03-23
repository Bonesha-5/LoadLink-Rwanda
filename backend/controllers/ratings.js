import * as svc from "../service/ratings.js";
import { catchAsync } from "../utils/catchAsync.js";

export const submit = catchAsync(async (req, res) => {
  const { shipment_id, truck_id, stars, comment } = req.body;
  const rating = await svc.submitRating(shipment_id, req.user.id, truck_id, stars, comment);
  res.status(201).json(rating);
});
