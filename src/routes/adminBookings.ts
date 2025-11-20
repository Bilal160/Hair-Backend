import * as express from "express";
import { UserAuthController } from "../controllers/auth/authController";
import { UserBookingController } from "../controllers/booking/userBookingController"
import { userAuthMiddleware } from "../middlewares/userAuthMiddleware";
import { asyncHandler } from "../utils/helperUtils";
import { uploadPhotoMiddleware } from "../middlewares/uploadPhotoMiddleware";
import { BusinessBookingController } from "../controllers/booking/businessBookingController";
import { AdminBusinessBookingController } from "../controllers/booking/adminBookingController";
import { adminAuthMiddleware } from "../middlewares/adminAuthMiddleware";

const router = express.Router();


router.get("/list", adminAuthMiddleware, asyncHandler(AdminBusinessBookingController.getAllBookings));
router.put(
    "/:id",
    adminAuthMiddleware,
    asyncHandler(AdminBusinessBookingController.updateBooking)
);
router.get(
    "/:id",
    adminAuthMiddleware,
    asyncHandler(AdminBusinessBookingController.getBooking)
);





export = router;
