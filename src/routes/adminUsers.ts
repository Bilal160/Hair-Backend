import * as express from "express";
import { asyncHandler } from "../utils/helperUtils";
import { adminAuthMiddleware } from "../middlewares/adminAuthMiddleware";
import { AdminUserController } from "../controllers/users/adminUser/adminUser";

const router = express.Router();

// router.put(
//   "/profile",
//   adminAuthMiddleware,
//   uploadLogoPhotoMiddleware,
//   asyncHandler(AdminBusinessController.updateBusinessProfile)
// );
// router.get(
//   "/profile",
//   userAuthMiddleware,
//   asyncHandler(AdminBusinessController.getBusinessProfile)
// );
router.get(
  "/list",
  adminAuthMiddleware,
  asyncHandler(AdminUserController.fetchUsersWithPaginationController)
);

// router.get(
//   "/:businessSlug",
//   adminAuthMiddleware,
//   asyncHandler(AdminBusinessController.getBusinessProfileBySlug)
// );

export default router;
