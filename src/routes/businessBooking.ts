import * as express from "express";
import { UserAuthController } from "../controllers/auth/authController";
import { UserBookingController } from "../controllers/booking/userBookingController"
import { userAuthMiddleware } from "../middlewares/userAuthMiddleware";
import { asyncHandler } from "../utils/helperUtils";
import { uploadPhotoMiddleware } from "../middlewares/uploadPhotoMiddleware";
import { BusinessBookingController } from "../controllers/booking/businessBookingController";

const router = express.Router();


router.get("/list", userAuthMiddleware, asyncHandler(BusinessBookingController.getAllBookings));
router.put(
    "/:id",
    userAuthMiddleware,
    asyncHandler(BusinessBookingController.updateBooking)
);
router.get(
    "/:id",
    userAuthMiddleware,
    asyncHandler(BusinessBookingController.getBooking)
);





export = router;
