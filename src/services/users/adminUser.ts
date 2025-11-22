import { User } from "../../models/user";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/jwtUtils";

export class AdminUserService {
  static async fetchUsersWithPagination(
    page: number,
    limit: number,
    query?: string,
    isVerified?: boolean
  ) {
    try {
      console.log(page, limit, query, "page, limit, query");

      const filterConditions: any = {};

      if (query?.trim()) {
        const trimmedSearch = query.trim();
        filterConditions.$or = [
          { name: { $regex: trimmedSearch, $options: "i" } },
          { email: { $regex: trimmedSearch, $options: "i" } },
          { userType: { $regex: trimmedSearch, $options: "i" } },
        ];
      }

      if (typeof isVerified === "boolean") {
        filterConditions.isVerified = isVerified;
      }

      // Always filter by roleType = 1
      filterConditions.roleType = 0;

      const options = {
        page,
        limit,
        sort: { createdAt: -1 },
        select: [
          "_id",
          "name",
          "email",
          "roleType",
          "userType",
          "createdAt",
          "updatedAt",
          "isVerified"
        ],
      };

      const usersData = await User.paginate(filterConditions, options);

      return {
        users: usersData.docs,
        pagination: {
          page: usersData.page,
          totalPages: usersData.totalPages,
          totalDocs: usersData.totalDocs,
          limit: usersData.limit,
        },
      };
    } catch (error) {
      console.error("Error fetching businesses:", error);
      throw error;
    }
  }


  static async activeorblockProfile(
    userId: string,
    action: boolean
  ) {
    console.log(userId, action, "userId and subscriptionType");

    try {
      const businessProfile = await User.findOneAndUpdate(
        { userId },
        { isVerified: action },
        { new: true }
      )
        .select("_id  userId isApproved userId")
        .lean();

      return businessProfile;
    } catch (error: any) {
      throw new Error(`Failed to update subscription type: ${error.message}`);
    }
  }
}
