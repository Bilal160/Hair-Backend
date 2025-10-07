import { Request, Response } from "express";
import { BusinessProfileService } from "../../../services/businessProfile/businessProfile";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../../utils/responseUtils";
import { updateBusinessProfileSchema } from "../../../validations/businessProfile";
import { handleValidationErrors } from "../../../utils/helperUtils";

import { UserBusinessProfileService } from "../../../services/businessProfile/userBusinessProfile";

export class UserBusinessProfileController {
  static async getNearbyBusinesses(req: Request, res: Response) {
    try {
      const {
        longitude,
        latitude,
        sortBy = "distance",
        maxDistance,
        query,
        subscriptionType,
      } = req.query;

      const result = await UserBusinessProfileService.findNearbyBusinesses({
        longitude: parseFloat(longitude as string),
        latitude: parseFloat(latitude as string),
        maxDistance: maxDistance ? Number(maxDistance) : undefined,
        searchParam: query as string,
        sortBy: sortBy as string,
        subscriptionType: subscriptionType as string,
      });

      console.log(result, "result in controller");

      if (result.businesses.length === 0) {
        return sendSuccessResponse(res, ["No nearby businesses found"], {
          result,
        });
      }

      return sendSuccessResponse(
        res,
        ["Nearby businesses fetched successfully"],
        result
      );
    } catch (error: any) {
      console.error("Error in getNearbyBusinesses:", error);
      return sendErrorResponse(
        res,
        ["Failed to fetch nearby businesses"],
        error.message
      );
    }
  }

  static async getBusinessProfileBySlug(req: Request, res: Response) {
    try {
      const businessSlug = req.params.businessSlug;
      console.log(businessSlug, "businessSlug in controller");
      if (
        !businessSlug ||
        businessSlug === "undefined" ||
        businessSlug.length === 0
      ) {
        return sendErrorResponse(res, ["Business slug is required"], 400);
      }
      const businessProfile =
        await UserBusinessProfileService.getBusinessProfileBySlug(businessSlug);
      return sendSuccessResponse(
        res,
        ["Business profile fetched successfully"],
        { business: businessProfile }
      );
    } catch (error) {
      console.log(error, "error in getBusinessProfileBySlug");
      return sendErrorResponse(res, ["Failed to fetch business profile"], 500);
    }
  }
}
