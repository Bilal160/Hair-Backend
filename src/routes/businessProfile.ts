import * as express from "express";
import { BusinessProfileController } from "../controllers/businessProfile/businessProfileController/businessProfileController";
import { asyncHandler } from "../utils/helperUtils";
import { userAuthMiddleware } from "../middlewares/userAuthMiddleware";
import { uploadPhotoMiddleware } from "../middlewares/uploadPhotoMiddleware";


const router = express.Router();



router.put(
  "/profile",
  userAuthMiddleware,
  uploadPhotoMiddleware,
  asyncHandler(BusinessProfileController.updateBusinessProfile)
);
router.get(
  "/profile",
  userAuthMiddleware,
  asyncHandler(BusinessProfileController.getBusinessProfile)
);
router.get(
  "/list",
  asyncHandler(BusinessProfileController.getNearbyBusinesses)
);
// router.get("/:id([0-9a-fA-F]{24})", userAuthMiddleware, asyncHandler(BusinessProfileController.getBusinessProfileById));
router.get(
  "/:businessSlug",
  asyncHandler(BusinessProfileController.getBusinessProfileBySlug)
);
router.get(
  "/list/featured",
  asyncHandler(
    BusinessProfileController.fetchFeaturedBusinessesWithPaginationController
  )
);



export default router;
