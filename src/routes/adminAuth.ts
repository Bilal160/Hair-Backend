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



router.post(
  "/members",
  adminAuthMiddleware,
  asyncHandler(AdminAuthController.adminRoleUser)
);

router.get(
  "/members/list",
  adminAuthMiddleware,
  asyncHandler(AdminAuthController.getAllMembers)
);

router.put(
  "/:id/members/changePassword",
  adminAuthMiddleware,
  asyncHandler(AdminAuthController.changeUserPasswordByAdmin)
);


router.put(
  "/:id/members/update",
  adminAuthMiddleware,
  asyncHandler(AdminAuthController.UpdateMemeber)
);
router.delete(
  "/:id/members/delete",
  adminAuthMiddleware,
  asyncHandler(AdminAuthController.DeleteMember)
);


router.put(
  "/activeorblock/:userId",
  adminAuthMiddleware,
  asyncHandler(AdminAuthController.activeOrBlock))



export = router;
