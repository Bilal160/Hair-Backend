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

    // static async getDealsByBusinessId(req: Request, res: Response) {
    //     try {
    //         const { businessId } = req.params;
    //         if (!businessId) {
    //             return sendErrorResponse(res, ["Business ID is required"], 400);
    //         }
    //         const deals = await ListofServices.getDealsByBusinessId(
    //             businessId
    //         );

    //         if (deals.length === 0) {
    //             return sendErrorResponse(res, ["No deals found"], 200);
    //         }
    //         return sendSuccessResponse(res, ["Deals fetched successfully"], {
    //             deals,
    //         });
    //     } catch (error: any) {
    //         return sendErrorResponse(res, ["Failed to fetch deals"], 500);
    //     }
    // }

    // static async getMatchingDeals(req: Request, res: Response) {
    //     try {
    //         const { businessId } = req.params;
    //         const { days, startTime, endTime } = req.body;

    //         if (!businessId || !days || !startTime || !endTime) {
    //             return res.status(400).json({ message: "Missing required fields" });
    //         }

    //         const deals = await ListofDealsHappyHoursService.getMatchingDeal({
    //             businessId,
    //             days,
    //             timeRange: {
    //                 startTime: new Date(startTime),
    //                 endTime: new Date(endTime),
    //             },
    //         });

    //         if (deals === null) {
    //             return sendErrorResponse(
    //                 res,
    //                 ["No Happy Hour Deal found for specified time"],
    //                 200
    //             );
    //         }

    //         return sendSuccessResponse(
    //             res,
    //             ["Deals fetched successfully"],
    //             {
    //                 deal: deals,
    //             },
    //             200
    //         );
    //     } catch (error: any) {
    //         return sendErrorResponse(res, ["Failed to fetch deals"], 500);
    //     }
    // }
}
