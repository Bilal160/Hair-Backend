import { Request, Response } from "express";
import { BusinessProfileService } from "../../../services/businessProfile/businessProfile";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../../utils/responseUtils";
import { updateBusinessProfileSchema } from "../../../validations/businessProfile";
import { handleValidationErrors } from "../../../utils/helperUtils";
import { deleteFile, handlePhotoUpload } from "../../../utils/imagesUtils";
import { Types } from "mongoose";
import { ImagesService } from "../../../services/imagesService";

export class BusinessProfileController {

  static async updateBusinessProfile(req: Request, res: Response) {
    try {
      const userId = req.userId;
      const parsedData = await BusinessProfileService.updateBusinessData(req.body);

      // Extract deletion requests
      const {
        removeBusinessPhotosIds = [],
        removeBusinessNICPhotoIds = [],
        removeBusinessRegistrationDocId,
        removeFeaturedImageId,
      } = parsedData.businessInfo;

      // Get existing profile
      const existingProfile = await BusinessProfileService.getBusinessProfileByUserId(userId);
      if (!existingProfile) {
        return sendErrorResponse(res, ["Business profile not found"], 404);
      }

      // Handle all deletions
      await Promise.all([
        ImagesService.handleDeletions(removeBusinessPhotosIds),
        ImagesService.handleDeletions(removeBusinessNICPhotoIds),
        ImagesService.handleDeletions(removeBusinessRegistrationDocId),
        ImagesService.handleDeletions(removeFeaturedImageId),
      ]);

      // Clean removed IDs from profile
      const cleanedProfile = {
        ...existingProfile,
        businessPhotosIds: existingProfile.businessPhotosIds?.filter(
          (id) => !removeBusinessPhotosIds.includes(id.toString())
        ),
        businessNICPhotoIds: existingProfile.businessNICPhotoIds?.filter(
          (id) => !removeBusinessNICPhotoIds.includes(id.toString())
        ),
        businessRegistrationDocId: removeBusinessRegistrationDocId?.includes(
          existingProfile.businessRegistrationDocId?.toString() || ""
        )
          ? null
          : existingProfile.businessRegistrationDocId,
        featuredImageId: removeFeaturedImageId?.includes(
          existingProfile.featuredImageId?.toString() || ""
        )
          ? null
          : existingProfile.featuredImageId,
      };

      await BusinessProfileService.updateBusinessProfile(userId, cleanedProfile);

      // Re-fetch to get accurate counts
      const updatedProfile = await BusinessProfileService.getBusinessProfileByUserId(userId);

      // Validate upload limits
      const files = req.files as any;
      const uploadLimits = [
        { field: 'businessPhotos', current: updatedProfile?.businessPhotosIds?.length || 0, max: 4, message: "You can only upload 4 business photos" },
        { field: 'businessNICPhoto', current: updatedProfile?.businessNICPhotoIds?.length || 0, max: 2, message: "You can only upload 2 business NIC photos" },
        { field: 'businessRegistrationDoc', current: updatedProfile?.businessRegistrationDocId ? 1 : 0, max: 1, message: "You can only upload 1 business registration document" },
        { field: 'businessFeaturedImage', current: updatedProfile?.featuredImageId ? 1 : 0, max: 1, message: "You can only upload 1 business featured image" },
      ];

      for (const limit of uploadLimits) {
        const incoming = files?.[limit.field]?.length || 0;
        if (incoming > 0 && limit.current + incoming > limit.max) {
          return sendErrorResponse(res, [limit.message], 400);
        }
      }

      // Prepare uploaded IDs object
      const uploaded = {
        businessPhotosIds: (updatedProfile.businessPhotosIds || []).map((id) => new Types.ObjectId(id)),
        businessNICPhotoIds: (updatedProfile.businessNICPhotoIds || []).map((id) => new Types.ObjectId(id)),
        businessRegistrationDocId: updatedProfile.businessRegistrationDocId
          ? new Types.ObjectId(updatedProfile.businessRegistrationDocId)
          : null,
        featuredImageId: updatedProfile.featuredImageId
          ? new Types.ObjectId(updatedProfile.featuredImageId)
          : null,
      };

      // Upload new files
      const uploadTasks: Array<{
        field: string;
        key: keyof typeof uploaded;
        multiple: boolean;
      }> = [
          { field: 'businessPhotos', key: 'businessPhotosIds', multiple: true },
          { field: 'businessNICPhoto', key: 'businessNICPhotoIds', multiple: true },
          { field: 'businessRegistrationDoc', key: 'businessRegistrationDocId', multiple: false },
          { field: 'businessFeaturedImage', key: 'featuredImageId', multiple: false },
        ];

      for (const task of uploadTasks) {
        const fileData = files?.[task.field];
        if (fileData?.length > 0) {
          const uploadedIds = await handlePhotoUpload(fileData, task.field);
          if (uploadedIds?.length) {
            if (task.multiple) {
              (uploaded[task.key] as Types.ObjectId[]) = [
                ...(uploaded[task.key] as Types.ObjectId[]),
                ...uploadedIds.map((id: string) => new Types.ObjectId(id)),
              ];
            } else {
              (uploaded[task.key] as Types.ObjectId | null) = new Types.ObjectId(uploadedIds[0]);
            }
          }
        }
      }

      // Merge uploaded files into payload
      const payload = {
        ...parsedData.businessInfo,
        ...uploaded,
      };

      // Enforce GeoJSON structure if location is being updated
      if (payload.businessLocation) {
        const existingLoc = updatedProfile.businessLocation ?? {};
        payload.businessLocation = {
          type: "Point",
          coordinates: payload.businessLocation.coordinates || existingLoc.coordinates,
          state: payload.businessLocation.state?.trim() || existingLoc.state || "",
          city: payload.businessLocation.city?.trim() || existingLoc.city || "",
          postalCode: payload.businessLocation.postalCode?.trim() || existingLoc.postalCode || "",
          streetAddress: payload.businessLocation.streetAddress?.trim() || existingLoc.streetAddress || "",
        };
      }

      // Final database update
      const businessProfile = await BusinessProfileService.updateBusinessProfile(userId, payload);

      return sendSuccessResponse(res, ["Business profile updated successfully"], {
        business: businessProfile,
      });
    } catch (error: any) {
      console.error("Error in updateBusinessProfile:", error);
      return sendErrorResponse(res, [error.message || "Failed to update business profile"], 500);
    }
  }





  static async getBusinessProfile(req: Request, res: Response) {
    const userId = req.userId;
    const businessProfile =
      await BusinessProfileService.getBusinessProfileByUserId(userId);

    return sendSuccessResponse(
      res,
      [`Business profile fetched  successfully`],
      { business: businessProfile }
    );
  }

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

      const result = await BusinessProfileService.findNearbyBusinesses({
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

  static async getBusinessProfileById(req: Request, res: Response) {
    const businessId = req.params.id;
    try {
      if (!businessId) {
        return sendErrorResponse(res, ["Business ID is required"], 400);
      }
      const businessProfile =
        await BusinessProfileService.getBusinessProfileById(businessId);
      return sendSuccessResponse(
        res,
        ["Business profile fetched successfully"],
        businessProfile
      );
    } catch (error) {
      return sendErrorResponse(res, ["Failed to fetch business profile"], 500);
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
        await BusinessProfileService.getBusinessProfileBySlug(businessSlug);
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

  static async fetchFeaturedBusinessesWithPaginationController(
    req: Request,
    res: Response
  ) {
    const { page = 1, limit = 10, subscriptionType = "featured" } = req.query;
    const businesses =
      await BusinessProfileService.fetchBusinessesWithPagination(
        Number(page),
        Number(limit),
        subscriptionType as string
      );

    if (businesses?.businesses?.length === 0) {
      return sendSuccessResponse(res, ["No Featured businesses found"], {
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


}
