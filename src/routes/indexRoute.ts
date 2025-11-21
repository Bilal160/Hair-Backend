import * as express from "express";
import bodyParser from "body-parser";
import adminAuth from "./adminAuth";
import cors from "cors";
import userAuth from "./userAuth";
import businessAuth from "./businessAuth";
import businessProfile from "./businessProfile";
import paymentRoutes from "./paymentRoutes";
import services from "./services";
import userServices from "./userServices";
import userBooking from "./userBooking"
import review from "./reviews";
import businessBooking from "./businessBooking";
import { asyncHandler } from "../utils/helperUtils";
import { BusinessAuthController } from "../controllers/auth/businessAuthController";
import adminBlogs from "./adminBlogs"
import userBlogs from "./userBlogs"
import contactUs from "./contactUs";
import adminBusinesses from "./adminBusinesses";
import adminBookings from "./adminBookings";
import adminUsers from "./adminUsers";
import adminServices from "./adminServices"


// Import route modules

export const routes = () => {
  let router = express.Router();

  const allowedOrigins = "*";

  const options: cors.CorsOptions = {
    origin: allowedOrigins,
  };
  router.post(
    "/stripe/webhook",
    express.raw({ type: "application/json" }),
    asyncHandler(BusinessAuthController.handleStripeWebhook)
  );
  router.use(cors(options));

  router.use(bodyParser.json());
  router.use(bodyParser.urlencoded({ extended: true }));

  router.get("/", (req, res) => {
    res.send("Welcome to Pronostic Backend API");
  });

  router.use("/auth/business", businessAuth);
  router.use("/auth", userAuth);
  router.use("/business", businessProfile);
  router.use("/business/payment", paymentRoutes);
  router.use("/business/services", services);
  router.use("/user/services", userServices);
  router.use("/user/booking/", userBooking);
  router.use("/admin/booking/", adminBookings)
  router.use("/business/booking/", businessBooking);
  router.use("/user/review", review);
  router.use("/auth/admin", adminAuth);
  router.use("/admin/blog", adminBlogs);
  router.use("/user/blog", userBlogs);
  router.use("/user/contact", contactUs);
  router.use("/business/admin", adminBusinesses);
  router.use("/admin/user", adminUsers);
  router.use("/admin/services", adminServices)



  return router;
};
