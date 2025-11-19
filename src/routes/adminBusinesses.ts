import * as express from "express";
import { asyncHandler } from "../utils/helperUtils";
import { adminAuthMiddleware } from "../middlewares/adminAuthMiddleware";
import { AdminBusinessProfileController } from "../controllers/businessProfile/adminBusinessProfile/adminBusinessProfile";

const router = express.Router();

// );
router.get(
  "/list",
  adminAuthMiddleware,
  asyncHandler(
    AdminBusinessProfileController.fetchBusinessesWithPaginationController
  )
);

router.get(
  "/:businessId",
  adminAuthMiddleware,
  asyncHandler(AdminBusinessProfileController.getBusinessProfileById)
);

router.put(
  "/subscriptionType/:userId",
  adminAuthMiddleware,
  asyncHandler(AdminBusinessProfileController.updateSubscriptionType)
);


router.put(
  "/activeorblock/:userId",
  adminAuthMiddleware,
  asyncHandler(AdminBusinessProfileController.activeOrBlock)
);

export default router;
