import { Request, Response } from "express";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../../utils/responseUtils";

import { AdminUserService } from "../../../services/users/adminUser";

export class AdminUserController {
  // static async updateBusinessProfile(req: Request, res: Response) {
  //   try {
  //     const userId = req.userId;
  //     const parsedData = await BusinessProfileService.parseBusinessData(
  //       req.body
  //     );

  //     const result = await updateBusinessProfileSchema.safeParse(parsedData);
  //     if (!result.success) {
  //       const errorMessage = handleValidationErrors(result.error);
  //       console.log(errorMessage, "validation errors");
  //       return sendErrorResponse(res, [errorMessage], 400);
  //     }

  //     let logoPhotoId: string | null = null;
  //     if (req.file) {
  //       const existingLogo =
  //         await BusinessProfileService.getBusinssExistingLogo(userId);
  //       logoPhotoId = await handleFileUpload(req.file, "logo");
  //       if (logoPhotoId) {
  //         parsedData.logoImageId = logoPhotoId;
  //       }
  //     }

  //     const businessProfile =
  //       await BusinessProfileService.updateBusinessProfile(userId, parsedData);

  //     return sendSuccessResponse(
  //       res,
  //       ["Business profile updated successfully"],
  //       businessProfile
  //     );
  //   } catch (error: any) {
  //     console.error("Error in updateBusinessProfile:", error);
  //     return sendErrorResponse(
  //       res,
  //       ["Failed to update business profile"],
  //       error.message || "Unknown error occurred"
  //     );
  //   }
  // }

  static async fetchUsersWithPaginationController(req: Request, res: Response) {
    console.log(req.roleType, "roleType in fetchBusinessesWithPagination");
    const { page = 1, limit = 10, query, isVerified } = req.query;
    console.log(page, limit, query, "page, limit, query");

    const parsedIsApproved =
      isVerified === "true"
        ? true
        : isVerified === "false"
          ? false
          : undefined;

    const users = await AdminUserService.fetchUsersWithPagination(
      Number(page),
      Number(limit),
      query as string,
      parsedIsApproved
    );

    if (users?.users?.length === 0) {
      return sendSuccessResponse(res, ["No users found"], {
        users: [],
        pagination: users.pagination,
      });
    }

    try {
      return sendSuccessResponse(res, ["Users fetched successfully"], users);
    } catch (error) {
      return sendErrorResponse(res, ["Failed to fetch users"], 500);
    }
  }

  static async activeOrBlock(req: Request, res: Response) {
    const { userId } = req.params;
    const { action } = req.body;

    try {
      const businessProfile =
        await AdminUserService.activeorblockProfile(
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
