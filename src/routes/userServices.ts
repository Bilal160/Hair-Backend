import * as express from "express";


import { asyncHandler } from "../utils/helperUtils";
import { uploadPhotoMiddleware } from "../middlewares/uploadPhotoMiddleware";
import { ListofServicesController } from "../controllers/services/userServicesController";

const router = express.Router();


router.get(
    "/list",
    asyncHandler(ListofServicesController.getAllServices)
);


export = router;
