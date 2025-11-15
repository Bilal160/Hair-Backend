import * as express from "express";
import { asyncHandler } from "../utils/helperUtils";
import { ContactUsController } from "../controllers/contactUs/contactUs";

const router = express.Router();
router.post("/", asyncHandler(ContactUsController.create));

export = router;
