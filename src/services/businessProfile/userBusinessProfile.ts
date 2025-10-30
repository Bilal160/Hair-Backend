import { BusinessProfile } from "../../models/businessProfile";
import { IBusinessProfile } from "../../interfaces/businessProfileInterface";
import { ImagesUpload } from "../../models/profilePhoto";
import { ReviewsService } from "../review/reviewServices";

import { getPostalCodeFromLatLng } from "../../utils/googleMap";
import { deleteFile } from "../../utils/imagesUtils";

export class UserBusinessProfileService {
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

  // static async getBusinessIdsByCategories({
  //   longitude,
  //   latitude,
  // }: {
  //   longitude: number;
  //   latitude: number;
  // }) {
  //   try {
  //     // 1. Fetch all businesses with geo + createdAt
  //     const businesses = await BusinessProfile.aggregate([
  //       {
  //         $geoNear: {
  //           near: { type: "Point", coordinates: [longitude, latitude] },
  //           distanceField: "distance",
  //           maxDistance: 25000, // 25km
  //           spherical: true,
  //         },
  //       },
  //       {
  //         $project: {
  //           _id: 1,
  //           distance: 1,
  //           createdAt: 1,
  //         },
  //       },
  //       { $sort: { createdAt: -1 } }, // For newArrival
  //     ]);

  //     const allBusinessIds = businesses.map((b) => ({
  //       _id: b._id.toString(),
  //       distance: b.distance,
  //       createdAt: b.createdAt,
  //     }));

  //     // 2. Near Me (within 25km already filtered above)
  //     const nearMe = allBusinessIds.map((b) => b._id);

  //     // 3. New Arrivals (latest 10 for example)
  //     const newArrival = allBusinessIds
  //       .sort(
  //         (a, b) =>
  //           new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  //       )
  //       .slice(0, 10) // optional: limit to 10 newest
  //       .map((b) => b._id);

  //     // 4. Top Rated – fetch reviews and sort
  //     const withReviews = await Promise.all(
  //       allBusinessIds.map(async (b) => {
  //         const { averageRating, totalReviews } =
  //           await ReviewsService.getReviews(b._id);
  //         return {
  //           _id: b._id,
  //           averageRating,
  //           totalReviews,
  //         };
  //       })
  //     );

  //     const topRated = withReviews
  //       .filter((r) => r.totalReviews > 0)
  //       .sort((a: any, b: any) => b.averageRating - a.averageRating)
  //       .map((r) => r._id);




  //     return {
  //       nearMe,
  //       topRated,
  //       newArrival,
  //     };
  //   } catch (err: any) {
  //     throw new Error(`Failed to get business IDs: ${err.message}`);
  //   }
  // }

  static async getBusinessIdsByCategories({
    longitude,
    latitude,
  }: {
    longitude: number;
    latitude: number;
  }) {
    try {
      // 1. Fetch businesses with geo + createdAt
      const businesses = await BusinessProfile.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [longitude, latitude] },
            distanceField: "distance",
            maxDistance: 25000, // 25km
            spherical: true,
          },
        },
        {
          $project: {
            _id: 1,
            distance: 1,
            createdAt: 1,
          },
        },
        { $sort: { createdAt: -1 } }, // for newArrival
      ]);

      const allBusinessIds = businesses.map((b) => ({
        _id: b._id.toString(),
        distance: b.distance,
        createdAt: b.createdAt,
      }));

      // 2. Near Me (all within 25km already)
      let nearMe = allBusinessIds.map((b) => b._id);

      // 3. New Arrivals (latest 10)
      let newArrival = allBusinessIds
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 10)
        .map((b) => b._id);

      // 4. Top Rated
      const withReviews = await Promise.all(
        allBusinessIds.map(async (b) => {
          const { averageRating, totalReviews } =
            await ReviewsService.getReviews(b._id);
          return {
            _id: b._id,
            averageRating,
            totalReviews,
          };
        })
      );

      let topRated = withReviews
        .filter((r) => r.totalReviews > 0)
        .sort((a: any, b: any) => b.averageRating - a.averageRating)
        .map((r) => r._id);

      /**
       * 5. Reorder results by subscription type
       * For only the selected IDs (nearMe, newArrival, topRated)
       */
      async function reorderBySubscription(ids: string[]) {
        if (!ids.length) return [];

        const businesses = await BusinessProfile.find(
          { _id: { $in: ids } },
          { _id: 1, subscriptionType: 1 }
        ).lean();

        // Define order by string (not number)
        const subscriptionOrder = ["sponsored", "standard", "free"];

        const typeMap = new Map(
          businesses.map((b) => [b._id.toString(), b.subscriptionType])
        );

        return ids.sort((a, b) => {
          const typeA = typeMap.get(a) || "free";
          const typeB = typeMap.get(b) || "free";

          const idxA = subscriptionOrder.indexOf(typeA);
          const idxB = subscriptionOrder.indexOf(typeB);

          if (idxA === idxB) return 0; // preserve original order if same type
          return idxA - idxB; // order by string position
        });
      }
      // Apply sorting


      nearMe = await reorderBySubscription(nearMe);
      newArrival = await reorderBySubscription(newArrival);
      topRated = await reorderBySubscription(topRated);




      return {
        nearMe,
        topRated,
        newArrival,
      };
    } catch (err: any) {
      throw new Error(`Failed to get business IDs: ${err.message}`);
    }
  }






  // static async getBusinessIdsSortedBy({
  //   longitude,
  //   latitude,
  //   sortType,
  // }: {
  //   longitude: number;
  //   latitude: number;
  //   sortType: number; // 0: bestRating, 1: nearToMe
  // }) {
  //   console.log(longitude, latitude, sortType, "longitude, latitude, sortType");
  //   try {
  //     if (sortType === 0) {
  //       // ---- BEST RATING CASE ----
  //       // Fetch ALL businesses with subscriptionType
  //       const businesses = await BusinessProfile.find({}, { _id: 1, subscriptionType: 1 });

  //       const allBusinessIds = businesses.map((b) => ({
  //         _id: b._id?.toString(),
  //         subscriptionType: b.subscriptionType || "standard",
  //       }));

  //       console.log(`Total businesses found: ${allBusinessIds.length}`);

  //       console.log("Sorting by Best Rating...");
  //       const withReviews = await Promise.all(
  //         allBusinessIds.map(async (b) => {
  //           const { averageRating, totalReviews } =
  //             await ReviewsService.getReviews(b._id as string);
  //           return {
  //             _id: b._id,
  //             subscriptionType: b.subscriptionType,
  //             averageRating: averageRating || 0,
  //             totalReviews: totalReviews || 0,
  //           };
  //         })
  //       );

  //       const bestRated = withReviews
  //         .sort((a: any, b: any) => {
  //           // First priority: sponsored businesses
  //           if (a.subscriptionType === "sponsored" && b.subscriptionType !== "sponsored") {
  //             return -1; // a comes first
  //           }
  //           if (b.subscriptionType === "sponsored" && a.subscriptionType !== "sponsored") {
  //             return 1; // b comes first
  //           }

  //           // Second priority: rating (for same subscription type)
  //           if (b.averageRating !== a.averageRating) {
  //             return b.averageRating - a.averageRating; // higher rating first
  //           }
  //           // Third priority: number of reviews
  //           return b.totalReviews - a.totalReviews; // more reviews first
  //         })
  //         .map((r) => r._id);

  //       console.log(`Best Rating: Returning ${bestRated.length} businesses`);
  //       return bestRated;
  //     }

  //     if (sortType === 1) {
  //       // ---- NEAR TO ME CASE ----
  //       console.log("Sorting by Near to Me...");

  //       // Step 1: Get businesses within 25km with subscriptionType
  //       const nearbyBusinesses = await BusinessProfile.aggregate([
  //         {
  //           $geoNear: {
  //             near: { type: "Point", coordinates: [longitude, latitude] },
  //             distanceField: "distance",
  //             maxDistance: 25000, // 25 km
  //             spherical: true,
  //           },
  //         },
  //         {
  //           $project: {
  //             _id: 1,
  //             distance: 1,
  //             subscriptionType: 1,
  //           },
  //         },
  //       ]);

  //       // Sort nearby businesses: sponsored first, then by distance
  //       const nearbySorted = nearbyBusinesses.sort((a, b) => {
  //         // First priority: sponsored businesses
  //         if (a.subscriptionType === "sponsored" && b.subscriptionType !== "sponsored") {
  //           return -1; // a comes first
  //         }
  //         if (b.subscriptionType === "sponsored" && a.subscriptionType !== "sponsored") {
  //           return 1; // b comes first
  //         }
  //         // Second priority: distance (for same subscription type)
  //         return a.distance - b.distance;
  //       });

  //       const nearbyIds = nearbySorted.map((b) => b._id.toString());

  //       console.log(`Near to Me: Found ${nearbyIds.length} within 25km`);

  //       // Step 2: Fetch ALL other businesses outside 25km with subscriptionType
  //       const allBusinessIds = await BusinessProfile.find(
  //         { _id: { $nin: nearbyIds } },
  //         { _id: 1, subscriptionType: 1 }
  //       ).lean();

  //       // Sort other businesses: sponsored first, then by _id for consistency
  //       const otherSorted = allBusinessIds.sort((a, b) => {
  //         // First priority: sponsored businesses
  //         if (a.subscriptionType === "sponsored" && b.subscriptionType !== "sponsored") {
  //           return -1; // a comes first
  //         }
  //         if (b.subscriptionType === "sponsored" && a.subscriptionType !== "sponsored") {
  //           return 1; // b comes first
  //         }
  //         // Second priority: _id for consistency
  //         return a._id.toString().localeCompare(b._id.toString());
  //       });

  //       const otherIds = otherSorted.map((b) => b._id.toString());

  //       // Step 3: Combine (nearby first, then all others)
  //       const finalList = [...nearbyIds, ...otherIds];

  //       console.log(
  //         `Near to Me: Returning total ${finalList.length} businesses`
  //       );
  //       return finalList;
  //     }

  //     throw new Error(
  //       "Invalid sortType. Use 0 for bestRating or 1 for nearToMe"
  //     );
  //   } catch (err: any) {
  //     throw new Error(`Failed to get sorted business IDs: ${err.message}`);
  //   }
  // }

  static async getBusinessIdsSortedBy({
    longitude,
    latitude,
    sortType,
  }: {
    longitude: number;
    latitude: number;
    sortType: number; // 0: bestRating, 1: nearToMe
  }) {
    console.log(longitude, latitude, sortType, "longitude, latitude, sortType");
    try {
      // ---- Step 1: Get all nearby businesses (within 25 km) ----
      const nearbyBusinesses = await BusinessProfile.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [longitude, latitude] },
            distanceField: "distance",
            maxDistance: 25000, // 25 km radius
            spherical: true,
          },
        },
        {
          $project: {
            _id: 1,
            distance: 1,
            subscriptionType: 1,
          },
        },
      ]);

      if (!nearbyBusinesses.length) {
        console.log("No businesses found within 25 km range.");
        return [];
      }

      console.log(`Found ${nearbyBusinesses.length} businesses within 25 km.`);

      // ---- Step 2: Sorting logic based on sortType ----
      if (sortType === 0) {
        // ✅ BEST RATING (but only within 25 km)

        console.log("Sorting nearby businesses by Best Rating...");

        const withReviews = await Promise.all(
          nearbyBusinesses.map(async (b) => {
            const { averageRating, totalReviews } = await ReviewsService.getReviews(
              b._id.toString()
            );
            return {
              _id: b._id.toString(),
              subscriptionType: b.subscriptionType || "standard",
              averageRating: averageRating || 0,
              totalReviews: totalReviews || 0,
              distance: b.distance,
            };
          })
        );

        const sortedByRating = withReviews.sort((a, b) => {
          // 1️⃣ Priority: Sponsored first
          if (a.subscriptionType === "sponsored" && b.subscriptionType !== "sponsored")
            return -1;
          if (b.subscriptionType === "sponsored" && a.subscriptionType !== "sponsored")
            return 1;

          // 2️⃣ Then by Rating (desc)
          if (Number(b.averageRating ?? 0) !== Number(a.averageRating ?? 0))
            return Number(b.averageRating ?? 0) > Number(a.averageRating ?? 0) ? -1 : 1;

          // 3️⃣ Then by Total Reviews (desc)
          if (Number(b.totalReviews ?? 0) !== Number(a.totalReviews ?? 0))
            return Number(b.totalReviews ?? 0) > Number(a.totalReviews ?? 0) ? -1 : 1;

          // 4️⃣ Finally by Distance (nearest first)
          return a.distance - b.distance;
        });

        console.log(`Best Rating (within 25km): Returning ${sortedByRating.length} businesses`);
        return sortedByRating.map((b) => b._id);
      }

      if (sortType === 1) {
        // ✅ NEAR TO ME (within 25 km)
        console.log("Sorting nearby businesses by Distance...");

        const sortedByDistance = nearbyBusinesses.sort((a, b) => {
          // 1️⃣ Sponsored first
          if (a.subscriptionType === "sponsored" && b.subscriptionType !== "sponsored")
            return -1;
          if (b.subscriptionType === "sponsored" && a.subscriptionType !== "sponsored")
            return 1;

          // 2️⃣ Then by distance (nearest first)
          return a.distance - b.distance;
        });

        console.log(`Near to Me (within 25km): Returning ${sortedByDistance.length} businesses`);
        return sortedByDistance.map((b) => b._id.toString());
      }

      throw new Error("Invalid sortType. Use 0 for bestRating or 1 for nearToMe");
    } catch (err: any) {
      console.error("Error in getBusinessIdsSortedBy:", err.message);
      throw new Error(`Failed to get sorted business IDs: ${err.message}`);
    }
  }


  static async getBusinessProfileBySlug(businessSlug: string) {
    try {
      const businessProfile = await BusinessProfile.findOne({
        slug: businessSlug,
      })
        .populate({
          path: "bannerImage",
          select:
            "-fileName -__v -createdAt -updatedAt  -fileType -fileExtension -fileSize -uploadDate",
        })
        .populate({
          path: "user",
          select: "firstName lastName email userType roleType", // Only select these fields
        })
        .populate({
          path: "logoImage",
          select:
            "-fileName -__v -createdAt -updatedAt  -fileType -fileExtension -fileSize -uploadDate",
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
}
