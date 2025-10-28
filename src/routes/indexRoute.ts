import * as express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import userAuth from "./userAuth";
import businessAuth from "./businessAuth";
import businessProfile from "./businessProfile";
import paymentRoutes from "./paymentRoutes";
import services from "./services";
import userServices from "./userServices";
import userBooking from "./userBooking"

// Import route modules

export const routes = () => {
  let router = express.Router();

  const allowedOrigins = "*";

  const options: cors.CorsOptions = {
    origin: allowedOrigins,
  };

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
  router.use("/user/services/viewAll/", userServices);
  router.use("/user/booking/", userBooking);


  return router;
};
