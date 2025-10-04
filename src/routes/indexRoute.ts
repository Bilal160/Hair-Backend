import * as express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import userAuth from "./userAuth";
import businessAuth from "./businessAuth";


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



  return router;
};
