import * as express from "express";
import { PaymentController } from "../controllers/paymentController/paymentController";
import { asyncHandler } from "../utils/helperUtils";
import { userAuthMiddleware } from "../middlewares/userAuthMiddleware";

const router = express.Router();

router.post(
  "/setupIntent",
  userAuthMiddleware,
  asyncHandler(PaymentController.createSetupIntent)
);
router.post(
  "/card",
  userAuthMiddleware,
  asyncHandler(PaymentController.savePaymentCardController)
);
router.get(
  "/subscription",
  userAuthMiddleware,
  asyncHandler(PaymentController.getSubscriptionController)
);
router.put(
  "/card",
  userAuthMiddleware,
  asyncHandler(PaymentController.updateStripeCardController)
);

router.delete(
  "/card",
  userAuthMiddleware,
  asyncHandler(PaymentController.removePaymentCardController)
);
router.put(
  "/changePlan",
  userAuthMiddleware,
  asyncHandler(PaymentController.changePlanController)
);

export default router;
