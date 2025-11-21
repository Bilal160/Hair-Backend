import * as express from "express";
import { BusinessServiceController } from "../controllers/services/businessServiceController";
import { userAuthMiddleware } from "../middlewares/userAuthMiddleware";
import { asyncHandler } from "../utils/helperUtils";
import { uploadPhotoMiddleware } from "../middlewares/uploadPhotoMiddleware";
import { AdminServiceController } from "../controllers/services/adminServicesController";

const router = express.Router();


router.get(
    "/list",
    userAuthMiddleware,
    asyncHandler(AdminServiceController.getAllServices)
);
router.get(
    "/:id",
    userAuthMiddleware,
    asyncHandler(AdminServiceController.getService)
);
router.put(
    "/:id",
    userAuthMiddleware,
    uploadPhotoMiddleware,
    asyncHandler(AdminServiceController.updateService)
);

router.delete(
    "/:id",
    userAuthMiddleware,
    asyncHandler(AdminServiceController.deleteService)
);

export = router;
