import * as express from "express";
import { asyncHandler } from "../utils/helperUtils";
import { ReviewController } from "../controllers/reviews/reviewController";
import { userAuthMiddleware } from "../middlewares/userAuthMiddleware";

const router = express.Router();

router.post("/", userAuthMiddleware, asyncHandler(ReviewController.addReview));
router.put(
  "/:reviewId/:businessId",
  userAuthMiddleware,
  asyncHandler(ReviewController.updateReview)
);
router.delete(
  "/:reviewId/:businessId",
  userAuthMiddleware,
  asyncHandler(ReviewController.deleteReview)
);
router.get(
  "/:reviewId/:businessId",
  userAuthMiddleware,
  asyncHandler(ReviewController.getReviewById)
);

export default router;
