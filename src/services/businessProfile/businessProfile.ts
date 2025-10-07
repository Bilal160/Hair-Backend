import { BusinessProfile } from "../../models/businessProfile";
import { IBusinessProfile } from "../../interfaces/businessProfileInterface";
import { ImagesUpload } from "../../models/profilePhoto";
import { ReviewsService } from "../review/reviewServices";

import { getPostalCodeFromLatLng } from "../../utils/googleMap";
import { deleteFile } from "../../utils/imagesUtils";
import { deleteLogoFile } from "../../middlewares/uploadPhotoMiddleware";
import { generateToken } from "../../utils/helperUtils";

export class BusinessProfileService {
  static async createBusinessProfile(payload: Partial<IBusinessProfile>) {
    try {
      const businessProfile = await BusinessProfile.create(payload);
      return businessProfile;
    } catch (error: any) {
      throw new Error(`Failed to create business profile: ${error.message}`);
    }
  }

  static async updateBusinessProfile(userId: string, payload: any) {
    try {
      const existingProfile = await BusinessProfile.findOne({ userId });
      if (!existingProfile) {
        throw new Error("Business profile not found");
      }

      const updatedProfile = await BusinessProfile.findOneAndUpdate(
        { userId },
        payload,
        { new: true }
      ).select(
        "-__v -createdAt -updatedAt -businessLocation.type -reviews -rating -averageRating -totalReviews"
      );

      return updatedProfile;
    } catch (error: any) {
      throw new Error(`Failed to update business profile: ${error.message}`);
    }
  }




  static async getBusinessProfile(userId: string) {
    console.log(userId, "userId");
    try {
      const businessProfile = await BusinessProfile.findOne({ userId })
        .select("-__v -createdAt -updatedAt ")

        .populate([
          {
            path: "user",
            select: "firstName lastName email ", // Only select these fields
          },
          {
            path: "businessPhotos",
            select:
              "-fileName -__v -createdAt -updatedAt  -fileType -fileExtension -fileSize -uploadDate",
          },
          {
            path: "featuredImage",
            select:
              "-fileName -__v -createdAt -updatedAt  -fileType -fileExtension -fileSize -uploadDate",
          },
          {
            path: "businessNICPhoto",
            select:
              "-fileName -__v -createdAt -updatedAt  -fileType -fileExtension -fileSize -uploadDate",
          },
          {
            path: "businessRegistrationDoc",
            select:
              "-fileName -__v -createdAt -updatedAt  -fileType -fileExtension -fileSize -uploadDate",
          }
        ])

      const reviews = await ReviewsService.getReviews(
        businessProfile?._id as string
      );
      const businessProfileData = {
        ...(businessProfile?.toObject() as IBusinessProfile),
        reviews: reviews.reviews,
        averageRating: reviews.averageRating,
        totalReviews: reviews.totalReviews,
      };

      if (businessProfileData?.businessName?.length > 0) {
        return businessProfileData;
      }

      return null;
    } catch (error: any) {
      throw new Error(`Failed to get business profile: ${error.message}`);
    }
  }

  static async getBusinessProfileByUserId(userId: string) {
    try {
      const businessProfile = await BusinessProfile.findOne({ userId })
        .select("-__v -createdAt -updatedAt  ")
        .populate([
          {
            path: "user",
            select: "firstName lastName email ", // Only select these fields
          },
          {
            path: "businessPhotos",
            select:
              "-fileName -__v -createdAt -updatedAt  -fileType -fileExtension -fileSize -uploadDate",
          },
          {
            path: "featuredImage",
            select:
              "-fileName -__v -createdAt -updatedAt  -fileType -fileExtension -fileSize -uploadDate",
          },
          {
            path: "businessNICPhoto",
            select:
              "-fileName -__v -createdAt -updatedAt  -fileType -fileExtension -fileSize -uploadDate",
          },
          {
            path: "businessRegistrationDoc",
            select:
              "-fileName -__v -createdAt -updatedAt  -fileType -fileExtension -fileSize -uploadDate",
          }
        ])

      const reviews = await ReviewsService.getReviews(
        businessProfile?._id as string
      );
      const businessProfileData = {
        ...(businessProfile?.toObject() as IBusinessProfile),
        reviews: reviews.reviews,
        averageRating: reviews.averageRating,
        totalReviews: reviews.totalReviews,
      };

      return businessProfileData;
    } catch (error: any) {
      throw new Error(`Failed to get business profile: ${error.message}`);
    }
  }

  static async findNearbyBusinesses({
    longitude,
    latitude,
    maxDistance = 100000,
    minDistance = 0,
    searchParam,
    sortBy,
    subscriptionType,
  }: {
    longitude: number;
    latitude: number;
    maxDistance?: number;
    minDistance?: number;
    searchParam?: string;
    sortBy?: string;
    subscriptionType?: string;
  }) {
    try {
      const pipeline: any[] = [
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            distanceField: "distance",
            maxDistance,
            minDistance,
            spherical: true,
          },
        },
        {
          $lookup: {
            from: "images",
            localField: "bannerImageId",
            foreignField: "_id",
            as: "logoImage",
          },
        },
        {
          $unwind: {
            path: "$bannerImage",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },
        // $addFields removed: $unwind with preserveNullAndEmptyArrays: true already sets missing fields to null
      ];

      // If a searchParam is provided, match any field
      if (searchParam?.trim()) {
        const trimmedSearch = searchParam.trim();
        pipeline.push({
          $match: {
            $or: [
              { tags: trimmedSearch },
              { businessName: { $regex: trimmedSearch, $options: "i" } },
              { businessDescription: { $regex: trimmedSearch, $options: "i" } },
            ],
          },
        });
      }

      // Sort by distance in aggregation if needed
      if (sortBy === "distance") {
        pipeline.push({ $sort: { distance: 1 } });
      }

      // Project desired fields
      pipeline.push({
        $project: {
          _id: 1,
          businessName: 1,
          businessDescription: 1,
          phone: 1,
          telegramLink: 1,
          instagramId: 1,
          workingHours: 1,
          businessLocation: 1,
          slug: 1,
          businessSlug: 1,
          averageRating: 1,
          totalReviews: 1,
          distance: 1,
          tags: 1,
          subscriptionType: 1,
          logoImageId: 1,
          websiteLink: 1,
          logoImage: {
            $cond: [
              { $ifNull: ["$bannerImage", false] },
              {
                _id: "$bannerImage._id",
                url: "$bannerImage.url",
                originalName: "$bannerImage.originalName",
              },
              null,
            ],
          },
          userId: 1,
          user: {
            $cond: [
              { $ifNull: ["$user", false] },
              {
                _id: "$user._id",
                firstName: "$user.firstName",
                lastName: "$user.lastName",
                email: "$user.email",
                userType: "$user.userType",
                roleType: "$user.roleType",
              },
              null,
            ],
          },
        },
      });

      // Fetch businesses
      const businesses = await BusinessProfile.aggregate(pipeline);

      // Enrich with reviews
      const businessesWithReviews = await Promise.all(
        businesses.map(async (business) => {
          const reviewsData = await ReviewsService.getReviews(business._id);
          return {
            ...business,
            averageRating: reviewsData.averageRating,
            totalReviews: reviewsData.totalReviews,
          };
        })
      );

      let sortedBusinesses = businessesWithReviews;

      // Sort by rating if requested
      if (sortBy === "rating") {
        sortedBusinesses = sortedBusinesses.sort(
          (a, b) => b.averageRating - a.averageRating
        );
      }

      // Sort by priority of match if searchParam exists
      if (searchParam?.trim()) {
        const lowerSearch = searchParam.toLowerCase();
        sortedBusinesses = sortedBusinesses.sort((a, b) => {
          const getPriority = (biz: any) => {
            if (biz.tags?.includes(searchParam)) return 1;
            if (biz.businessName?.toLowerCase().includes(lowerSearch)) return 2;
            if (biz.businessDescription?.toLowerCase().includes(lowerSearch))
              return 3;
            return 4;
          };
          return getPriority(a) - getPriority(b);
        });
      }

      return {
        businesses: sortedBusinesses,
      };
    } catch (err: any) {
      throw new Error(`Search failed: ${err.message}`);
    }
  }

  static async getBusinessProfileById(businessId: string) {
    try {
      const businessProfile = await BusinessProfile.findById(businessId)

        .select(
          "businessName businessDescription businessLocation phone telegramLink instagramId workingHours averageRating totalReviews reviews instagramToken"
        )
        .populate({
          path: "logoImage",
          select:
            "-fileName -__v -createdAt -updatedAt  -fileType -fileExtension -fileSize -uploadDate",
        })

        .populate({
          path: "bannerImage",
          select:
            "-fileName -__v -createdAt -updatedAt  -fileType -fileExtension -fileSize -uploadDate",
        })
        .populate({
          path: "user",
          select: "firstName lastName email ", // Only select these fields
        });

      const reviews = await ReviewsService.getReviews(
        businessProfile?._id as string
      );
      const businessProfileData = {
        ...businessProfile?.toObject(),
        reviews: reviews.reviews,
        averageRating: reviews.averageRating,
        totalReviews: reviews.totalReviews,
      };

      if (!businessProfile) {
        throw new Error("Business profile not found");
      }

      return businessProfileData;
    } catch (error: any) {
      throw new Error(`Failed to get business profile: ${error.message}`);
    }
  }

  static async getBusinessProfileBySlug(businessSlug: string) {
    try {
      const businessProfile = await BusinessProfile.findOne({
        slug: businessSlug,
      })
        .populate({
          path: "logoImage",
          select:
            "-fileName -__v -createdAt -updatedAt  -fileType -fileExtension -fileSize -uploadDate",
        })

        .populate({
          path: "logoImage",
          select:
            "-fileName -__v -createdAt -updatedAt  -fileType -fileExtension -fileSize -uploadDate",
        })
        .populate({
          path: "user",
          select: "firstName lastName email userType roleType", // Only select these fields
        });

      const reviews = await ReviewsService.getReviews(
        businessProfile?._id as string
      );
      const businessProfileData = {
        ...businessProfile?.toObject(),
        reviews: reviews.reviews,
        averageRating: reviews.averageRating,
        totalReviews: reviews.totalReviews,
      };
      return businessProfileData;
    } catch (error: any) {
      throw new Error(`Failed to get business profile: ${error.message}`);
    }
  }





  static async parseBusinessData(data: any) {
    var businessLocationData = data.businessLocation || {
      type: "Point",
      coordinates: [Number(data.longitude), Number(data.latitude)],
      state: data?.state ? data?.state : "",
      city: data?.city ? data?.city : "",
      postalCode: data?.postalCode ? data?.postalCode : "",
      streetAddress: data?.streetAddress ? data?.streetAddress : "",
    };

    if (
      !data.postalCode ||
      data?.postalCode.length === 0 ||
      data.postalCode === "" ||
      data.postalCode === null
    ) {
      const postalCode = await getPostalCodeFromLatLng(
        Number(data.latitude),
        Number(data.longitude)
      );

      businessLocationData.postalCode = postalCode?.postalCode || "";
    }

    const parsedData: any = {
      businessName: data.businessName,
      businessDescription: data.businessDescription,
      telegramLink: data.telegramLink,
      phone: data.phone,
      instagramId: data.instagramId,
      operatingHours: data.operatingHours,
      businessLocation: { ...businessLocationData },
      websiteLink: data.websiteLink,
      googleBusinessLink: data.googleBusinessLink,
      lunchSpecialTime: data.lunchSpecialTime,
      dailySpecialTime: data.dailySpecialTime,
      logoImageId: data.logoImageId,
      removeLogo: Boolean(data.removeLogo),
      removeBanner: Boolean(data.removeBanner),
      instagramToken: data.instagramToken,
    };

    console.log(parsedData, "parsedData");
    return parsedData;
  }

  static async fetchBusinessesWithPagination(
    page: number,
    limit: number,
    subscriptionType: string
  ) {
    try {
      console.log(
        page,
        limit,
        subscriptionType,
        "page, limit, subscriptionType"
      );

      const filterConditions: any = {
        subscriptionType: subscriptionType,
      };

      const options = {
        page,
        limit,
        sort: { createdAt: -1 },
        select: [
          "_id",
          "businessName",
          "phone",
          "telegramLink",
          "instagramId",
          "workingHours",
          "businessLocation",
          "slug",
          "businessSlug",
          "averageRating",
          "totalReviews",
          "userId",
          "subscriptionType",
          "websiteLink",
        ],
        populate: [
          {
            path: "user",
            select: "firstName lastName email ", // Only select these fields
          },
          {
            path: "logoImage",
            select:
              "-fileName -__v -createdAt -updatedAt  -fileType -fileExtension -fileSize -uploadDate",
          },
          {
            path: "bannerImage",
            select:
              "-fileName -__v -createdAt -updatedAt  -fileType -fileExtension -fileSize -uploadDate",
          },
        ],
      };

      const businesses = await BusinessProfile.paginate(
        filterConditions,
        options
      );

      const businessesWithReviews = await Promise.all(
        businesses.docs.map(async (business) => {
          const reviews = await ReviewsService.getReviews(
            business?._id as string
          );

          console.log(reviews, "reviews");
          return {
            ...business.toObject(),
            reviews: reviews.reviews,
            averageRating: reviews.averageRating,
            totalReviews: reviews.totalReviews,
          };
        })
      );

      return {
        businesses: businessesWithReviews,
        pagination: {
          page: businesses.page,
          totalPages: businesses.totalPages,
          totalDocs: businesses.totalDocs,
          limit: businesses.limit,
        },
      };
    } catch (error) {
      console.error("Error fetching businesses:", error);
      throw error;
    }
  }

  static async getIdofBusinessProfileUserId(userId: string) {
    try {
      const businessProfile = await BusinessProfile.findOne({ userId });
      return businessProfile?._id?.toString();
    } catch (error: any) {
      throw new Error(`Failed to get business profile: ${error.message}`);
    }
  }




  static async updateSubscriptionType(
    userId: string,
    subscriptionType: string
  ) {
    console.log(userId, subscriptionType, "userId and subscriptionType");

    try {
      const businessProfile = await BusinessProfile.findOneAndUpdate(
        { userId },
        { subscriptionType: subscriptionType },
        { new: true }
      )
        .select("_id  userId subscriptionType userId")
        .lean();

      console.log(businessProfile, "businessProfile");
      return businessProfile;
    } catch (error: any) {
      throw new Error(`Failed to update subscription type: ${error.message}`);
    }
  }


  static async getUserSubscriptionType(userId: string) {
    try {
      const businessProfile = await BusinessProfile.findOne({ userId });
      return businessProfile?.subscriptionType;
    } catch (error: any) {
      throw new Error(`Failed to get user subscription type: ${error.message}`);
    }
  }

  static async saveInstagramToken(
    userId: string,
    instagramToken: string,
    tokenExpiry: Date
  ) {
    try {
      const businessProfile = await BusinessProfile.findOneAndUpdate(
        { userId },
        {
          $set: {
            "instagramInfo.instagramToken": instagramToken,
            "instagramInfo.tokenExpiry": tokenExpiry,
          },
        },
        { new: true }
      )
        .select("_id userId instagramInfo")
        .lean();

      return businessProfile;
    } catch (error: any) {
      throw new Error(`Failed to save instagram token: ${error.message}`);
    }
  }


  static async checktokenvalidity(id: string) {
    try {
      const businessProfile = await BusinessProfile.findById(id)
        .select("instagramInfo")
        .lean();

      const tokenExpiry: Date | undefined = (businessProfile as any)?.instagramInfo?.tokenExpiry;
      if (!tokenExpiry) {
        return { isValid: false, daysUntilExpiry: 0 };
      }

      const now = new Date();
      const msDiff = new Date(tokenExpiry).getTime() - now.getTime();
      const daysUntilExpiry = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
      return { isValid: msDiff > 0, daysUntilExpiry };
    } catch (error: any) {
      throw new Error(`Failed to check token validity: ${error.message}`);
    }
  }

  static async getUserByBusinessId(id: string) {
    try {
      const businessProfile = await BusinessProfile.findById(id)
        .select('userId instagramInfo')
        .lean();
      return businessProfile
    } catch (error: any) {
      throw new Error(`Failed to get business profile: ${error.message}`);
    }
  }




  static async updateBusinessData(data: any) {
    console.log(data, "data in service");

    try {
      // 🧹 Clean up keys (trim whitespace)
      const cleanedData: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        cleanedData[key.trim()] = value;
      }

      console.log("Cleaned Data:", cleanedData);

      // 🧠 Helper: safely parse ID arrays (handles invalid JSON too)
      const parseIdArray = (value: any): string[] => {
        if (!value) return [];
        try {
          if (typeof value === "string") {
            // Try valid JSON parsing first
            if (value.startsWith("[") && value.endsWith("]")) {
              try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
              } catch {
                // 🧹 Fallback: extract ObjectIds manually using regex
                const matches =
                  value.match(/"([0-9a-f]{24})"/g) ||
                  value.match(/[0-9a-f]{24}/g);
                return matches ? matches.map((m) => m.replace(/"/g, "")) : [];
              }
            }
            // Single ID case
            return [value];
          }

          // Already an array
          if (Array.isArray(value)) return value;

          return [];
        } catch (err) {
          console.warn("⚠️ Failed to parse ID array:", value);
          return [];
        }
      };

      // 🗺️ Prepare businessLocation object
      const businessLocation = {
        type: "Point",
        coordinates: [
          Number(cleanedData.longitude),
          Number(cleanedData.latitude),
        ],
        state: cleanedData.state,
        city: cleanedData.city,
        postalCode: cleanedData.postalCode,
        streetAddress: cleanedData.streetAddress,
      };

      // 🧩 Group all business info
      const businessInfo = {
        businessName: cleanedData.businessName,
        businessDescription: cleanedData.businessDescription,
        operatingHours: cleanedData.operatingHours,
        phone: cleanedData.businessPhone,
        businessLocation,

        // 🔄 Parse ID arrays safely
        removeBusinessPhotosIds: parseIdArray(cleanedData.removeBusinessPhotosIds),
        removeBusinessNICPhotoIds: parseIdArray(cleanedData.removeBusinessNICPhotoIds),
        removeBusinessRegistrationDocId: parseIdArray(cleanedData.removeBusinessRegistrationDocId),
        removeFeaturedImageId: parseIdArray(cleanedData.removeFeaturedImageId),
      };

      // ✅ Return formatted payload
      return { businessInfo };
    } catch (error) {
      console.error(error);
      throw new Error("Failed to format data");
    }
  }




}
