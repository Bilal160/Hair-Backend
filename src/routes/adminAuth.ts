import * as express from "express";
import { adminAuthMiddleware } from "../middlewares/adminAuthMiddleware";
import { asyncHandler } from "../utils/helperUtils";
import { AdminAuthController } from "../controllers/auth/adminAuthController";

const router = express.Router();
router.post("/login", asyncHandler(AdminAuthController.LoginAdminUser));
router.put(
  "/update",
  adminAuthMiddleware,
  asyncHandler(AdminAuthController.UpdateAdminUser)
);
router.put(
  "/changePassword",
  adminAuthMiddleware,
  asyncHandler(AdminAuthController.ChangeAdminPassword)
);
router.post(
  "/forgotPassword",
  asyncHandler(AdminAuthController.forgotAdminPassword)
);
router.put(
  "/resetPassword",
  asyncHandler(AdminAuthController.resetAdminPassword)
);

router.delete(
  "/logout",
  adminAuthMiddleware,
  asyncHandler(AdminAuthController.logoutUser)
);


// router.put(
//   "/:id/changePassword",
//   adminAuthMiddleware,
//   asyncHandler(AdminAuthController.changeUserPasswordByAdmin)
// );


export = router;
