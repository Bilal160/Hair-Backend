import { Request, Response } from "express";
import { BusinessProfileService } from "../../../services/businessProfile/businessProfile";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../../utils/responseUtils";

import { AdminBusinessProfileService } from "../../../services/businessProfile/adminBusinessProfile";

export class AdminBusinessProfileController {
  static async fetchBusinessesWithPaginationController(
    req: Request,
    res: Response
  ) {
    console.log(req.roleType, "roleType in fetchBusinessesWithPagination");
    const {
      page = 1,
      limit = 10,
      query,
      subscriptionStatus,
      startDate,
      endDate,
      subscriptionType,
    } = req.query;
    const businesses =
      await AdminBusinessProfileService.fetchBusinessesWithPagination(
        Number(page),
        Number(limit),
        query as string,
        subscriptionStatus as string,
        startDate as string,
        endDate as string,
        subscriptionType as string
      );

    if (businesses?.businesses?.length === 0) {
      return sendSuccessResponse(res, ["No businesses found"], {
        businesses: [],
        pagination: businesses.pagination,
      });
    }

    try {
      return sendSuccessResponse(
        res,
        ["Businesses fetched successfully"],
        businesses
      );
    } catch (error) {
      return sendErrorResponse(res, ["Failed to fetch businesses"], 500);
    }
  }

  static async getBusinessProfileById(req: Request, res: Response) {
    const businessId = req.params.businessId;
    try {
      if (!businessId) {
        return sendErrorResponse(res, ["Business ID is required"], 400);
      }
      const businessProfile =
        await AdminBusinessProfileService.getBusinessProfileById(businessId);
      return sendSuccessResponse(
        res,
        ["Business profile fetched successfully"],
        { business: businessProfile }
      );
    } catch (error: any) {
      if (error.message === "Business profile not found") {
        return sendErrorResponse(res, [error.message], 404);
      }
      console.log(error, "error in getBusinessProfileById");
      return sendErrorResponse(res, ["Failed to fetch business profile"], 500);
    }
  }

  static async updateSubscriptionType(req: Request, res: Response) {
    const { userId } = req.params;
    const { subscriptionType } = req.body;

    try {
      const businessProfile =
        await AdminBusinessProfileService.updateSubscriptionType(
          userId,
          subscriptionType
        );

      return sendSuccessResponse(
        res,
        ["Subscription type updated successfully"],
        {
          businessProfile: businessProfile,
        }
      );
    } catch (error) {
      console.log(error, "error in upateUserTypeController");
      return sendErrorResponse(res, ["Error updating user type"], 500);
    }
  }


  static async activeOrBlock(req: Request, res: Response) {
    const { userId } = req.params;
    const { action } = req.body;

    try {
      const businessProfile =
        await AdminBusinessProfileService.activeorblockProfile(
          userId,
          action
        );

      let resMessage = ""

      if (action === false) {
        resMessage = "Profile Blocked SuccessFully"
      }

      if (action === true) {
        resMessage = "Profie Approved Successfully"
      }

      return sendSuccessResponse(
        res,
        [`${resMessage}`],
        {
          businessProfile: businessProfile,
        }
      );
    } catch (error) {
      console.log(error, "error in upateUserTypeController");
      return sendErrorResponse(res, ["Error updating user type"], 500);
    }
  }
}
