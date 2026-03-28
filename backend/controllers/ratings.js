import { createRatingService } from "../service/ratings.js";
import { catchAsync } from "../utils/catchAsync.js";

// Create a rating for a shipment 
export const createRating = catchAsync(async (req, res) => {
  const { shipment_id, stars, comment } = req.body;
  const shipper_id = req.user.id;

  const rating = await createRatingService(shipment_id, shipper_id, stars, comment);

  res.status(201).json(rating);
});
