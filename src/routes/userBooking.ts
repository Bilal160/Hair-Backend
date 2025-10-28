import * as express from "express";
import { UserAuthController } from "../controllers/auth/authController";
import { UserBookingController } from "../controllers/booking/userBookingController"
import { userAuthMiddleware } from "../middlewares/userAuthMiddleware";
import { asyncHandler } from "../utils/helperUtils";
import { uploadPhotoMiddleware } from "../middlewares/uploadPhotoMiddleware";

const router = express.Router();

router.post("/", userAuthMiddleware, asyncHandler(UserBookingController.createBooking));
router.get("/list", userAuthMiddleware, asyncHandler(UserBookingController.getAllBookings));
router.put(
    "/:id",
    userAuthMiddleware,
    asyncHandler(UserBookingController.updateBooking)
);
router.get(
    "/:id",
    userAuthMiddleware,
    asyncHandler(UserBookingController.getBooking)
);
router.delete(
    "/:id",
    userAuthMiddleware,
    asyncHandler(UserBookingController.deleteBooking)
);




export = router;
