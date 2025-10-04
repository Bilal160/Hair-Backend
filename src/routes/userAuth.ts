import * as express from "express";
import { UserAuthController } from "../controllers/auth/authController";
import { userAuthMiddleware } from "../middlewares/userAuthMiddleware";
import { asyncHandler } from "../utils/helperUtils";
import { uploadPhotoMiddleware } from "../middlewares/uploadPhotoMiddleware";

const router = express.Router();

router.post("/signup", asyncHandler(UserAuthController.RegisterUser));
router.post("/login", asyncHandler(UserAuthController.LoginUser));
router.put(
  "/update",
  userAuthMiddleware,
  uploadPhotoMiddleware,
  asyncHandler(UserAuthController.UpdateUser)
);
router.put(
  "/changePassword",
  userAuthMiddleware,
  asyncHandler(UserAuthController.ChangePassword)
);
router.post(
  "/sessionValidate",
  userAuthMiddleware,
  asyncHandler(UserAuthController.sessionValidation)
);
router.delete(
  "/logout",
  userAuthMiddleware,
  asyncHandler(UserAuthController.logoutUser)
);
router.post("/forgotPassword", asyncHandler(UserAuthController.forgotPassword));
router.put("/resetPassword", asyncHandler(UserAuthController.resetPassword));
router.post("/verifyCode", asyncHandler(UserAuthController.verifyCode));
router.put("/verifyEmail", userAuthMiddleware, asyncHandler(UserAuthController.verifyEmail));
router.post("/sendEmailVerification", asyncHandler(UserAuthController.sendVerificationEmail));  


export = router;
