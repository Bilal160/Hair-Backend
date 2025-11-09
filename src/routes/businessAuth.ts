import * as express from "express";
import { BusinessAuthController } from "../controllers/auth/businessAuthController";
import { userAuthMiddleware } from "../middlewares/userAuthMiddleware";
import { uploadPhotoMiddleware } from "../middlewares/uploadPhotoMiddleware";

const router = express.Router();

const asyncHandler =
  (fn: Function) =>
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };

router.post(
  "/signup",
  uploadPhotoMiddleware, // multer handles files + body
  asyncHandler(BusinessAuthController.RegisterBusinessUser)
);

router.post("/login", asyncHandler(BusinessAuthController.LoginBusinessUser));
// router.post(
//   "/googleLogin",
//   asyncHandler(BusinessAuthController.googleLoginControllerForBusiness)
// );
router.put(
  "/changePassword",
  userAuthMiddleware,
  asyncHandler(BusinessAuthController.ChangePasswordForBusiness)
);
router.put(
  "/update",
  uploadPhotoMiddleware,
  userAuthMiddleware,
  asyncHandler(BusinessAuthController.UpdateBusinessUser)
);
router.post(
  "/forgotPassword",
  asyncHandler(BusinessAuthController.forgotPasswordForBusiness)
);
router.put(
  "/resetPassword",
  asyncHandler(BusinessAuthController.resetPasswordForBusiness)
);
router.delete(
  "/logout",
  userAuthMiddleware,
  asyncHandler(BusinessAuthController.logoutUser)
);
router.post(
  "/setupConnectAccount",
  userAuthMiddleware,
  asyncHandler(BusinessAuthController.setupConnectAccount)
);


router.get(
  "/checkAccountStatus",
  userAuthMiddleware,
  asyncHandler(BusinessAuthController.checkConnectedAccountStatus)
);

router.get(
  "/regenerateLink",
  userAuthMiddleware,
  asyncHandler(BusinessAuthController.regenerateConnectLink)
);

router.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  asyncHandler(BusinessAuthController.handleStripeWebhook)
);
export = router;
