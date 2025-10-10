import { Request, Response } from "express";
import { BusinessService } from "../../services/businessServices/businessService";
import { Types } from "mongoose";
import {
  createServiceSchema,
  updateServiceSchema,
} from "../../validations/serviceValidation";
import mongoose, { Document } from "mongoose";
import { handleValidationErrors } from "../../utils/helperUtils";
import { ImagesService } from "../../services/imagesService";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../utils/responseUtils";
import { handlePhotoUpload } from "../../utils/imagesUtils";
import { BusinessProfileService } from "../../services/businessProfile/businessProfile";

export class BusinessServiceController {
  static async createService(req: Request, res: Response) {
    const userId = req.userId;
    const businessId =
      await BusinessProfileService.getIdofBusinessProfileUserId(userId);

    const formattedData = await BusinessService.formattedData({
      ...req.body,
    });
    const dataToValidate = {
      ...formattedData,
      userId: userId,
      businessId: businessId,
    };

    console.log(dataToValidate);

    const result = createServiceSchema.safeParse(dataToValidate);
    if (!result.success) {
      const errorMessage = handleValidationErrors(result.error);
      return sendErrorResponse(res, [errorMessage], 400);
    }

    let servicePhoto = (req.files as any)?.servicePhoto;

    if (!servicePhoto) {
      return sendErrorResponse(res, ["Service Photo is required"], 400);
    }
    let servicePhotoId: mongoose.Types.ObjectId | undefined;

    try {
      if (servicePhoto && servicePhoto.length > 0) {
        const uploadedIds = await handlePhotoUpload(
          Array.isArray(servicePhoto) ? servicePhoto : [servicePhoto],
          "servicePhoto"
        );
        if (uploadedIds && uploadedIds.length > 0) {
          servicePhotoId = new mongoose.Types.ObjectId(uploadedIds[0]);
        }
      }

      const payload = {
        ...result.data,
        userId: new mongoose.Types.ObjectId(result.data.userId),
        businessId: new Types.ObjectId(result.data.businessId),
        servicePhotoId,
      };

      const service = await BusinessService.createService(payload);
      return sendSuccessResponse(res, ["Service created successfully"], {
        service,
      });
    } catch (error: any) {
      return sendErrorResponse(res, [error.message], 500);
    }
  }

  static async getService(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const service = await BusinessService.getServiceById(id);
      if (!service) {
        return sendErrorResponse(res, ["Service not found"], 404);
      }
      return sendSuccessResponse(res, ["Service fetched successfully"], {
        service,
      });
    } catch (error: any) {
      return sendErrorResponse(res, [error.message], 500);
    }
  }

  static async getAllServices(req: Request, res: Response) {
    const userId = req.userId;
    const businessId =
      await BusinessProfileService.getIdofBusinessProfileUserId(userId);

    console.log("list call ");
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";

    try {
      const result = await BusinessService.fetchServicesWithPagination({
        userId,
        businessId: businessId || "",
        page,
        limit,
        search,
      });

      return sendSuccessResponse(
        res,
        ["Services fetched successfully"],
        result
      );
    } catch (error: any) {
      return sendErrorResponse(res, [error.message], 500);
    }
  }

  static async updateService(req: Request, res: Response) {
    const userId = req.userId;
    const businessId =
      await BusinessProfileService.getIdofBusinessProfileUserId(userId);

    const formattedData = await BusinessService.formattedData({
      ...req.body,
    });
    const dataToValidate = {
      ...formattedData,
      userId: userId,
      businessId: businessId,
    };

    const result = updateServiceSchema.safeParse(dataToValidate);
    if (!result.success) {
      const errorMessage = handleValidationErrors(result.error);
      return sendErrorResponse(res, [errorMessage], 400);
    }
    try {
      const { id } = req.params;
      let updatePayload: any = { ...result.data };

      // Remove photo if requested
      if (result.data.removePhoto === "true") {
        const existingService = (await BusinessService.getServiceById(
          id
        )) as any;
        if (existingService?.servicePhotoId) {
          const photoDoc = await ImagesService.getPhotoById(
            existingService.servicePhotoId.toString()
          );
          if (photoDoc && photoDoc.key) {
            await ImagesService.deletePhotoById(
              existingService.servicePhotoId.toString(),
              photoDoc.key
            );
          }
          updatePayload.servicePhotoId = null;
        }
      }

      // New photo upload (replace old if present)
      let servicePhoto = (req.files as any)?.servicePhoto;
      console.log(servicePhoto, "Comming Photo");
      if (servicePhoto && servicePhoto.length > 0) {
        const existingService = (await BusinessService.getServiceById(
          id
        )) as any;
        if (existingService?.servicePhotoId) {
          const photoDoc = await ImagesService.getPhotoById(
            existingService.servicePhotoId.toString()
          );
          if (photoDoc && photoDoc.key) {
            await ImagesService.deletePhotoById(
              existingService.servicePhotoId.toString(),
              photoDoc.key
            );
          }
        }
        const uploadedIds = await handlePhotoUpload(
          Array.isArray(servicePhoto) ? servicePhoto : [servicePhoto],
          "servicePhoto"
        );

        console.log(uploadedIds, "hgcg");
        if (uploadedIds && uploadedIds.length > 0) {
          updatePayload.servicePhotoId = new Types.ObjectId(uploadedIds[0]);
        }
      }

      const service = await BusinessService.updateService(id, updatePayload);
      if (!service) {
        return sendErrorResponse(res, ["Service not found"], 404);
      }
      return sendSuccessResponse(res, ["Service updated successfully"], {
        service,
      });
    } catch (error: any) {
      return sendErrorResponse(res, [error.message], 500);
    }
  }

  static async deleteService(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await BusinessService.deleteService(id);
      if (!deleted) {
        return sendErrorResponse(res, ["Service not found"], 404);
      }
      return sendSuccessResponse(res, ["Service deleted successfully"], {});
    } catch (error: any) {
      return sendErrorResponse(res, [error.message], 500);
    }
  }
}
