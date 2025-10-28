import { Service } from "../../../src/models/serviceModel";
import { ReviewsService } from "../../services/review/reviewServices";

export class ListofServices {
    static async getListofDeals(
        page: number,
        limit: number,
        categoryId: string,
        businessIds: string[]
    ) {
        try {
            const query: any = {};

            if (categoryId) {
                query.categoryId = categoryId;
            }

            if (businessIds && businessIds.length > 0) {
                query.businessId = { $in: businessIds };
            }

            const options: any = {
                page,
                limit,
                sort: { createdAt: -1 },
                select: [
                    "_id",
                    "name",
                    "price",
                    "businessId",
                    "categoryId",
                    "dealPhotoIds",
                    "isActive",
                    "createdAt",
                    "updatedAt",
                ],
                populate: [
                    {
                        path: "dealPhoto",
                        select: "url _id webpUrl",
                    },
                    {
                        path: "category",
                        select: "name _id",
                    },
                ],
            };

            const deals = await Service.paginate(query, options);

            return {
                deals: deals.docs,
                pagination: {
                    page: deals.page,
                    totalPages: deals.totalPages,
                    totalDocs: deals.totalDocs,
                    limit: deals.limit,
                },
            };
        } catch (error: any) {
            console.error("Error fetching deals:", error.message);
            throw new Error("Failed to fetch deals");
        }
    }


    static async getServicesBySortedBusinessOrder(
        businessIds: string[],
        categoryId?: string, // kept for signature consistency
        limit?: number,
        page?: number,
        price?: number,
        sortBy?: number,
        time?: string, // kept for signature consistency
        days?: string[] // kept for signature consistency
    ) {
        try {
            if ((!businessIds || businessIds.length === 0) && sortBy !== 2) {
                return {
                    services: [],
                    pagination: {
                        page: 1,
                        totalPages: 0,
                        totalDocs: 0,
                        limit: limit || 0,
                    },
                };
            }

            const query: any = { isActive: true };

            // ✅ Filter only by businessIds when sortBy ≠ 2
            if (sortBy !== 2) {
                query.businessId = { $in: businessIds };
            }

            // ✅ Removed categoryId, time, and days filters completely

            // ✅ Price filter (kept)
            if (price) {
                query.$expr = {
                    $lte: [
                        {
                            $toDouble: {
                                $replaceAll: { input: "$price", find: " $", replacement: "" },
                            },
                        },
                        price,
                    ],
                };
            }

            // Subscription priority order
            type SubscriptionType = "sponsored" | "standard" | "free";
            const priority: Record<SubscriptionType, number> = {
                sponsored: 1,
                standard: 2,
                free: 3,
            };

            // ============================================
            // CASE 1: sortBy = 2 (New Arrivals)
            // ============================================
            if (sortBy === 2) {
                const allServices = await Service.find(query)
                    .select([
                        "_id",
                        "name",
                        "price",
                        "businessId",
                        "categoryId",
                        "servicePhotoId",
                        "isActive",
                        "days",
                        "timeRange",
                        "createdAt",
                        "updatedAt",
                    ])
                    .populate([
                        { path: "servicePhoto", select: "url _id webpUrl" },
                        {
                            path: "business",
                            select:
                                "businessName _id averageRating totalReviews reviews businessSlug slug subscriptionType websiteLink businessLocation",
                        },
                    ])
                    .lean();

                const filteredServices = allServices; // no time/day filtering

                // Attach reviews
                const businessIdsInServices = [
                    ...new Set(filteredServices.map((s) => s.businessId.toString())),
                ];

                const businessReviews = await Promise.all(
                    businessIdsInServices.map(async (businessId) => {
                        const { averageRating, totalReviews, reviews } =
                            await ReviewsService.getReviews(businessId);
                        return { businessId, averageRating, totalReviews, reviews };
                    })
                );

                const businessReviewsMap = new Map(
                    businessReviews.map((br) => [br.businessId, br])
                );

                const enrichedServices = filteredServices
                    .map((service) => {
                        const reviewData = businessReviewsMap.get(service.businessId.toString());
                        return {
                            ...service,
                            businessInfo: {
                                ...(service as any).business,
                                averageRating: reviewData?.averageRating || 0,
                                totalReviews: reviewData?.totalReviews || 0,
                                reviews: reviewData?.reviews || [],
                            },
                        };
                    })
                    .sort((a: any, b: any) => {
                        const aType =
                            priority[
                            (a.businessInfo?.subscriptionType as SubscriptionType) || "free"
                            ];
                        const bType =
                            priority[
                            (b.businessInfo?.subscriptionType as SubscriptionType) || "free"
                            ];
                        if (aType !== bType) return aType - bType;
                        return (
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                        );
                    });

                const totalDocs = enrichedServices.length;
                const startIndex = ((page || 1) - 1) * (limit || 10);
                const paginatedServices = enrichedServices.slice(
                    startIndex,
                    startIndex + (limit || 10)
                );

                return {
                    services: paginatedServices,
                    pagination: {
                        page: page || 1,
                        totalPages: Math.ceil(totalDocs / (limit || 10)),
                        totalDocs,
                        limit: limit || 10,
                    },
                };
            }

            // ============================================
            // CASE 2: Normal businessIds order
            // ============================================
            const allServices = await Service.find(query)
                .select([
                    "_id",
                    "name",
                    "price",
                    "businessId",
                    "categoryId",
                    "servicePhotoId",
                    "isActive",
                    "days",
                    "timeRange",
                    "createdAt",
                    "updatedAt",
                ])
                .populate([
                    { path: "servicePhoto", select: "url _id webpUrl" },
                    {
                        path: "business",
                        select:
                            "businessName _id averageRating totalReviews reviews businessSlug slug subscriptionType websiteLink businessLocation",
                    },
                ])
                .lean();

            const filteredServices = allServices; // ✅ no day/time filter

            const businessReviews = await Promise.all(
                businessIds.map(async (businessId) => {
                    const { averageRating, totalReviews, reviews } =
                        await ReviewsService.getReviews(businessId);
                    return { businessId, averageRating, totalReviews, reviews };
                })
            );

            const businessReviewsMap = new Map(
                businessReviews.map((br) => [br.businessId, br])
            );

            const enrichedServices = filteredServices
                .map((service) => {
                    const reviewData = businessReviewsMap.get(service.businessId.toString());
                    return {
                        ...service,
                        business: {
                            ...(service as any).business,
                            averageRating: reviewData?.averageRating || 0,
                            totalReviews: reviewData?.totalReviews || 0,
                            reviews: reviewData?.reviews || [],
                        },
                    };
                })
                .sort((a: any, b: any) => {
                    const aType =
                        priority[
                        (a.businessInfo?.subscriptionType as SubscriptionType) || "free"
                        ];
                    const bType =
                        priority[
                        (b.businessInfo?.subscriptionType as SubscriptionType) || "free"
                        ];
                    if (aType !== bType) return aType - bType;

                    const aIndex = businessIds.indexOf(a.businessId.toString());
                    const bIndex = businessIds.indexOf(b.businessId.toString());
                    if (aIndex !== bIndex) return aIndex - bIndex;

                    return (
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    );
                });

            const startIndex = ((page || 1) - 1) * (limit || enrichedServices.length);
            const sortedServices = enrichedServices.slice(
                startIndex,
                startIndex + (limit || enrichedServices.length)
            );

            return {
                services: sortedServices,
                pagination: {
                    page: page || 1,
                    totalPages: Math.ceil(
                        enrichedServices.length / (limit || enrichedServices.length)
                    ),
                    totalDocs: enrichedServices.length,
                    limit: limit || enrichedServices.length,
                },
            };
        } catch (error: any) {
            console.error("Error fetching services by sorted business order:", error.message);
            throw new Error("Failed to fetch services by sorted business order");
        }
    }



}
