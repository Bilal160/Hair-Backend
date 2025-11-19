import { BusinessProfile } from "../../models/businessProfile";
import { IBusinessProfile } from "../../interfaces/businessProfileInterface";
import { ImagesUpload } from "../../models/profilePhoto";
import { ReviewsService } from "../review/reviewServices";

import { getPostalCodeFromLatLng } from "../../utils/googleMap";
import { deleteFile } from "../../utils/imagesUtils";
import { User } from "../../models/user";
import { SubscriptionModel } from "../../models/subscription";

import mongoose from "mongoose";
import { PaymentService } from "../payment/paymentService";

export class AdminBusinessProfileService {
  static async fetchBusinessesWithPagination(
    page: number,
    limit: number,
    query?: string,
    subscriptionStatus?: string,
    startDate?: string,
    endDate?: string,
    subscriptionType?: string
  ) {
    try {
      const filterConditions: any = {};

      // 🌐 Handle search query (business + user email)
      if (query?.trim()) {
        const trimmedSearch = query.trim();
        const matchingUsers = await User.find(
          {
            $or: [
              { email: { $regex: trimmedSearch, $options: "i" } },
              { name: { $regex: trimmedSearch, $options: "i" } },
            ],
          },
          { _id: 1 }
        );
        const userIds = matchingUsers.map((u) => u._id);

        filterConditions.$or = [
          { businessName: { $regex: trimmedSearch, $options: "i" } },
          { businessDescription: { $regex: trimmedSearch, $options: "i" } },
          { tags: { $regex: trimmedSearch, $options: "i" } },
          { subscriptionType: { $regex: trimmedSearch, $options: "i" } },
        ];

        if (userIds.length > 0) {
          filterConditions.$or.push({ userId: { $in: userIds } });
        }
      }

      // ✅ Filter subscriptionType from BusinessProfile
      if (subscriptionType) {
        filterConditions.subscriptionType = subscriptionType;
      }

      let subscriptionUserIds: string[] = [];

      // ✅ Handle special case: Not Subscribed
      if (subscriptionStatus === "Not Subscribed") {
        const subscribedUsers = await SubscriptionModel.find({}, { userId: 1 });
        const subscribedUserIds = subscribedUsers.map(
          (sub) => sub.userId?.toString() || ""
        );

        filterConditions.userId = { $nin: subscribedUserIds };
      }

      // 🔍 Handle other subscription filters
      else if (subscriptionStatus || startDate || endDate) {
        const subscriptionQuery: any = {};

        if (subscriptionStatus) {
          subscriptionQuery.subscriptionStatus = subscriptionStatus;
        }

        // ⏱️ Date filtering logic
        if (startDate && !endDate) {
          const start = new Date(startDate);
          const startEnd = new Date(startDate);
          startEnd.setDate(startEnd.getDate() + 1);

          subscriptionQuery.subscriptionStartDate = {
            $gte: start,
            $lt: startEnd,
          };
        }

        if (endDate && !startDate) {
          const end = new Date(endDate);
          const endEnd = new Date(endDate);
          endEnd.setDate(endEnd.getDate() + 1);

          subscriptionQuery.subscriptionExpiryDate = {
            $gte: end,
            $lt: endEnd,
          };
        }

        if (startDate && endDate) {
          subscriptionQuery.subscriptionStartDate = {
            $gte: new Date(startDate),
          };
          const end = new Date(endDate);
          end.setDate(end.getDate() + 1);
          subscriptionQuery.subscriptionExpiryDate = {
            $lt: end,
          };
        }

        const matchingSubscriptions = await SubscriptionModel.find(
          subscriptionQuery,
          { userId: 1 }
        );

        subscriptionUserIds = matchingSubscriptions.map(
          (sub) => sub.userId?.toString() || ""
        );

        // Intersect if userId filter already exists
        if (filterConditions.userId && filterConditions.userId.$in) {
          filterConditions.userId.$in = filterConditions.userId.$in.filter(
            (id: string) => subscriptionUserIds.includes(id.toString())
          );
        } else {
          filterConditions.userId = { $in: subscriptionUserIds };
        }
      }

      // 📦 Pagination options
      const options = {
        page,
        limit,
        sort: { createdAt: -1 },
        populate: [
          { path: "user", select: "name email" }
          // {
          //   path: "bannerImage",
          //   select:
          //     "-fileName -__v -createdAt -updatedAt -fileType -fileExtension -fileSize -uploadDate",
          // },
          // {
          //   path: "logoImage",
          //   select:
          //     "-fileName -__v -createdAt -updatedAt -fileType -fileExtension -fileSize -uploadDate",
          // },
        ],
      };

      const businesses = await BusinessProfile.paginate(
        filterConditions,
        options
      );

      // 🔁 Attach reviews and subscription
      const businessesWithExtras = await Promise.all(
        businesses.docs.map(async (business) => {
          const reviews = await ReviewsService.getReviews(
            (business?._id as any).toString()
          );

          const subscription = await SubscriptionModel.findOne({
            userId: business.userId,
          });

          return {
            ...business.toObject(),
            reviews: reviews.reviews,
            averageRating: reviews.averageRating,
            totalReviews: reviews.totalReviews,
            subscription,
          };
        })
      );

      return {
        businesses: businessesWithExtras,
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

  static async getBusinessProfileById(businessId: string) {
    console.log(businessId, "businessId in getBusinessProfileById");
    try {
      const businessProfile = await BusinessProfile.findOne({
        _id: businessId,
      })
        .select(
          "businessName businessDescription businessLocation phone telegramLink instagramId  averageRating totalReviews reviews websiteLink logoImageId userId  subscriptionType bannerImageId   lunchSpecialTime   dailySpecialTime  operatingHours"
        )
        .populate([
          {
            path: "logoImage",
            select:
              "-fileName -__v -createdAt -updatedAt -fileType -fileExtension -fileSize -uploadDate",
          },
          {
            path: "bannerImage",
            select:
              "-fileName -__v -createdAt -updatedAt -fileType -fileExtension -fileSize -uploadDate",
          },

          {
            path: "user",
            select: "name email _id",
          },
        ]);

      console.log(businessProfile?.userId, "businessProfile");

      let subscription = null;
      try {
        subscription = await PaymentService.getSubscriptionByUserId(
          (businessProfile?.userId as any).toString()
        );
      } catch (subscriptionError) {
        console.error("Failed to fetch subscription:", subscriptionError);
        // You can choose to continue with null or throw an error based on your logic
      }

      const reviews = await ReviewsService.getReviews(
        businessProfile?._id as string
      );

      const businessProfileData = {
        ...businessProfile?.toObject(),
        reviews: reviews.reviews,
        averageRating: reviews.averageRating,
        totalReviews: reviews.totalReviews,
        subscription: subscription,
      };

      return businessProfileData;
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



  static async activeorblockProfile(
    userId: string,
    action: boolean
  ) {
    console.log(userId, action, "userId and subscriptionType");

    try {
      const businessProfile = await BusinessProfile.findOneAndUpdate(
        { userId },
        { isApproved: action },
        { new: true }
      )
        .select("_id  userId isApproved userId")
        .lean();

      console.log(businessProfile, "businessProfile");
      return businessProfile;
    } catch (error: any) {
      throw new Error(`Failed to update subscription type: ${error.message}`);
    }
  }
}
