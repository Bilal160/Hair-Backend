import * as express from "express";
import { BusinessServiceController } from "../controllers/services/businessServiceController";
import { userAuthMiddleware } from "../middlewares/userAuthMiddleware";
import { asyncHandler } from "../utils/helperUtils";
import { uploadPhotoMiddleware } from "../middlewares/uploadPhotoMiddleware";

const router = express.Router();

router.post(
  "/",
  userAuthMiddleware,
  uploadPhotoMiddleware,
  asyncHandler(BusinessServiceController.createService)
);
router.get(
  "/:id",
  userAuthMiddleware,
  asyncHandler(BusinessServiceController.getService)
);
router.put(
  "/:id",
  userAuthMiddleware,
  uploadPhotoMiddleware,
  asyncHandler(BusinessServiceController.updateService)
);
router.get(
  "/list",
  userAuthMiddleware,
  asyncHandler(BusinessServiceController.getAllServices)
);
router.delete(
  "/:id",
  userAuthMiddleware,
  asyncHandler(BusinessServiceController.deleteService)
);

export = router;
