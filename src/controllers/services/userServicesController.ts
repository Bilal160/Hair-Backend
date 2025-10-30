// controllers/business/dailySpecialDealController.ts
import { Request, Response } from "express";
import {
    sendErrorResponse,
    sendSuccessResponse,
} from "../../utils/responseUtils";
import { UserBusinessProfileService } from "../../services/businessProfile/userBusinessProfile";
import { ListofServices } from "../../services/businessServices/userBusinessServices";

export class ListofServicesController {
    static async getAllServices(req: Request, res: Response) {
        try {
            const {
                page = 1,
                limit = 10,
                categoryId = "",
                sortBy = 1,
                longitude,
                latitude,
                price,
                time,
                searchParam
            } = req.query;

            let businessIds: string[] = [];

            // ✅ Business IDs sirf tab fetch karo jab sortBy 0 ya 1 ho
            if (Number(sortBy) === 0 || Number(sortBy) === 1) {
                // Coordinates validation bhi tabhi karein jab businessIds chahiyein
                if (!longitude || !latitude) {
                    return sendErrorResponse(
                        res,
                        ["Longitude and latitude are required for sorting"],
                        400
                    );
                }

                businessIds = await UserBusinessProfileService.getBusinessIdsSortedBy({
                    longitude: Number(longitude),
                    latitude: Number(latitude),
                    sortType: Number(sortBy),
                });
            }

            // Deals fetch karo
            const services =
                await ListofServices.getServicesBySortedBusinessOrder(
                    businessIds,
                    Number(limit),
                    Number(page),
                    Number(price),
                    Number(sortBy),
                    searchParam as string
                );

            let resMessage = "Services Fetch Successfully";
            if (services.services.length === 0) {
                resMessage = "No service found";
            }

            return sendSuccessResponse(res, [resMessage], {
                services: services.services,
                pagination: services.pagination,
            });
        } catch (error: any) {
            return sendErrorResponse(
                res,
                ["Failed to fetch Services"],
                500,
                error.message
            );
        }
    }

    static async getService(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const service = await ListofServices.getServiceById(id);
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


}
