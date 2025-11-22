import { IMemberUpdate, IUser } from "../../interfaces/userInterface";
import { User } from "../../models/user";
import { PasswordEncrypt, PasswordMatch } from "../../utils/helperUtils";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/jwtUtils";
import { PasswordReset } from "../../models/passwordReset";

export class AdminAuthService {
  constructor(private readonly adminAuthService: AdminAuthService) { }

  static async registerUser(user: IUser) {
    try {
      const hashedPassword = await PasswordEncrypt(user.password);
      const newUser = await User.create({
        ...user,
        password: hashedPassword,
      });

      const accessToken = await generateAccessToken(
        (newUser._id as any).toString(),
        Number(newUser.roleType)
      );
      const refreshToken = await generateRefreshToken(
        (newUser._id as any).toString(),
        Number(newUser.roleType)
      );

      const { password, createdAt, updatedAt, __v, ...userWithoutPassword } =
        newUser.toObject();

      return {
        accessToken: accessToken.accessToken,
        refreshToken: refreshToken.refreshToken,
        user: userWithoutPassword,
      };
    } catch (error) {
      throw new Error(`Failed to register user: ${error}`);
    }
  }

  static async loginAdminUser(user: IUser, password: string) {
    console.log(user);
    const isPasswordValid = await PasswordMatch(password, user?.password);

    console.log(isPasswordValid);

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const accessToken = await generateAccessToken(
      (user._id as any).toString(),
      Number(user.roleType)
    );
    const refreshToken = await generateRefreshToken(
      (user._id as any).toString(),
      Number(user.roleType)
    );

    const {
      password: _,
      createdAt,
      updatedAt,
      __v,
      stripeCustomerId,
      ...userWithoutSensitiveFields
    } = user.toObject();

    return {
      accessToken: accessToken.accessToken,
      refreshToken: refreshToken.refreshToken,
      user: userWithoutSensitiveFields,
    };
  }

  static async updateUser(payload: Partial<IUser> & { userId: string }) {
    const { userId, ...updates } = payload;

    const updatedUser = (await User.findByIdAndUpdate(userId, updates, {
      new: true,
    }).select(
      "-password -createdAt -updatedAt -__v -id -stripeCustomerId"
    )) as IUser;

    return updatedUser;
  }

  static async changePassword(payload: {
    userId: string;
    password: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    const { userId, password, newPassword } = payload;

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const isPasswordValid = await PasswordMatch(password, user.password);
    if (!isPasswordValid) throw new Error("Your old password is incorrect");

    const hashedNewPassword = await PasswordEncrypt(newPassword);
    user.password = hashedNewPassword;

    console.log(user, "user in change password");

    const updatedUser = await user.save();

    const {
      password: _,
      createdAt,
      updatedAt,
      __v,
      stripeCustomerId,
      ...userSafe
    } = updatedUser.toObject();

    return userSafe;
  }

  static async userExists(email: string) {
    return !!(await User.findOne({ email }));
  }

  static async userByEmail(email: string) {
    try {
      const user = await User.findOne({ email }).select(
        "-password -createdAt -updatedAt -__v -id"
      );
      if (!user) {
        throw new Error("User not found");
      }
      return user;
    } catch (error: any) {
      // Don't wrap "User not found" error, let it pass through
      if (error.message === "User not found") {
        throw error;
      }
      throw new Error(`Internal Server Error: ${error}`);
    }
  }

  static async userByEmailForGoogle(email: string) {
    try {
      const user = await User.findOne({ email }).select(
        "-password -createdAt -updatedAt -__v "
      );
      if (!user) {
        return null;
      }
      return user;
    } catch (error: any) {
      // Don't wrap "User not found" error, let it pass through
      if (error.message === "User not found") {
        throw error;
      }
      throw new Error(`Internal Server Error: ${error}`);
    }
  }

  static async userByEmailWithPassword(email: string) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error("User not found");
      }
      return user;
    } catch (error: any) {
      // Don't wrap "User not found" error, let it pass through
      if (error.message === "User not found") {
        throw error;
      }
      throw new Error(`Internal Server Error: ${error}`);
    }
  }

  static async userById(id: string) {
    try {
      return await User.findById(id).select(
        "-password -createdAt -updatedAt -__v -id"
      );
    } catch (error) {
      // Handle invalid ObjectId format
      return null;
    }
  }

  static async saveToken(
    email: string,
    verificationCode: string,
    expireAt: Date
  ) {
    try {
      return await PasswordReset.findOneAndUpdate(
        { email },
        { $set: { email, verificationCode, expireAt } },
        { new: true, upsert: true }
      );
    } catch (error) {
      throw new Error(`Failed to save token: ${error}`);
    }
  }

  static async getVerificationCode(verificationCode: string) {
    try {
      const verificationCodeData = await PasswordReset.findOne({
        verificationCode,
      });
      if (!verificationCodeData) {
        throw new Error("Verification code not found");
      }
      if (verificationCodeData.expireAt < new Date()) {
        throw new Error("Verification code expired");
      }
      return verificationCodeData;
    } catch (error: any) {
      // Don't wrap specific errors, let them pass through
      if (
        error.message === "Verification code not found" ||
        error.message === "Verification code expired"
      ) {
        throw error;
      }
      throw new Error(`Failed to get verification code: ${error}`);
    }
  }

  static async updatePassword(payload: { userId: string; password: string }) {
    try {
      const { userId, password } = payload;
      const user = await User.findById(userId);
      if (!user) throw new Error("User not found");

      const hashedPassword = await PasswordEncrypt(password);
      user.password = hashedPassword;

      const updatedUser = await user.save();

      const {
        password: _,
        createdAt,
        updatedAt,
        __v,
        ...userSafe
      } = updatedUser.toObject();

      return userSafe;
    } catch (error) {
      throw new Error(`Failed to update password: ${error}`);
    }
  }

  // static async googleLoginServiceForUser(idToken: string, roleType: number) {
  //   try {
  //     const ticket = await client.verifyIdToken({
  //       idToken,
  //       audience: process.env.GOOGLE_CLIENT_ID,
  //     });
  //     const payload = ticket.getPayload();

  //     if (!payload?.email) {
  //       throw new Error("Invalid Google token");
  //     }

  //     const email = payload.email;
  //     const name = payload.name || "";

  //     // Check if user exists
  //     let user = await this.userByEmailForGoogle(email);

  //     console.log(user, "user in google login service");
  //     // If user exists, check roleType
  //     if (user && user.roleType !== roleType) {
  //       throw new Error("Not  a User");
  //     }

  //     // If user doesn't exist, create new user
  //     if (user === null) {
  //       const newUser = await this.registerUser({
  //         email,
  //         password: "", // Empty password for Google users
  //         name,
  //         roleType: roleType,
  //       } as IUser);

  //       return newUser;
  //     }

  //     // If user exists and roleType matches, issue tokens
  //     const accessToken = await generateAccessToken(
  //       (user._id as any).toString(),
  //       Number(user.roleType)
  //     );
  //     const refreshToken = await generateRefreshToken(
  //       (user._id as any).toString(),
  //       Number(user.roleType)
  //     );

  //     return {
  //       accessToken: accessToken.accessToken,
  //       refreshToken: refreshToken.refreshToken,
  //       user: user,
  //     };
  //   } catch (error: any) {
  //     console.log(error, "error in google login service");
  //     console.error(error);
  //     throw error;
  //   }
  // }

  // static async googleLoginServiceForBusiness(
  //   idToken: string,
  //   roleType: number
  // ) {
  //   try {
  //     const ticket = await client.verifyIdToken({
  //       idToken,
  //       audience: process.env.GOOGLE_CLIENT_ID,
  //     });
  //     const payload = ticket.getPayload();

  //     if (!payload?.email) {
  //       throw new Error("Invalid Google token");
  //     }

  //     const email = payload.email;
  //     const name = payload.name || "";

  //     // Check if user exists
  //     let user = await this.userByEmailForGoogle(email);

  //     // If user exists, check roleType
  //     if (user && user.roleType !== roleType) {
  //       throw new Error("Not  a Business User");
  //     }

  //     // If user doesn't exist, create new user
  //     if (user === null) {
  //       const newUser = await this.registerUser({
  //         email,
  //         password: "", // Empty password for Google users
  //         name,
  //         roleType: roleType,
  //       } as IUser);

  //       return newUser;
  //     }

  //     // If user exists and roleType matches, issue tokens
  //     const accessToken = await generateAccessToken(
  //       (user._id as any).toString(),
  //       Number(user.roleType)
  //     );
  //     const refreshToken = await generateRefreshToken(
  //       (user._id as any).toString(),
  //       Number(user.roleType)
  //     );

  //     return {
  //       accessToken: accessToken.accessToken,
  //       refreshToken: refreshToken.refreshToken,
  //       user: user,
  //     };
  //   } catch (error: any) {
  //     console.log(error, "error in google login service");
  //     console.error(error);
  //     throw error;
  //   }
  // }

  static async changeUserPasswordByAdmin(payload: {
    userId: string;
    confirmPassword: string;
  }) {
    const { userId, confirmPassword } = payload;

    // Fetch only needed fields
    const user = await User.findById(userId, {
      roleType: 1,
      name: 1,
      password: 1,
      email: 1,
    });
    if (!user) throw new Error("User not found");

    // Check if roleType matches
    if (user.roleType !== 1) {
      throw new Error("You can only change the password of Business User");
    }

    // Encrypt and update password
    const hashedNewPassword = await PasswordEncrypt(confirmPassword);
    user.password = hashedNewPassword;

    const updatedUser = await user.save();

    // Exclude sensitive fields but keep firstName
    const {
      password: _,
      createdAt,
      updatedAt,
      __v,
      stripeCustomerId,
      ...userSafe
    } = updatedUser.toObject();

    return userSafe; // this will now include firstName
  }




  static async addRoleUser(user: IUser) {
    try {
      const hashedPassword = await PasswordEncrypt(user.password);
      const newUser = await User.create({
        ...user,
        password: hashedPassword,
      });
      const {
        password,
        createdAt,
        updatedAt,
        __v,
        stripeCustomerId,

        ...userWithoutPassword
      } = newUser.toObject();

      return {
        user: userWithoutPassword,
      };
    } catch (error) {
      throw new Error(`Failed to register user: ${error}`);
    }
  }

  static async updateMember(
    payload: Partial<IMemberUpdate> & { memberId: string }
  ) {
    const { memberId, ...updates } = payload;

    const updatedUser = (await User.findByIdAndUpdate(memberId, updates, {
      new: true,
    }).select(
      "-password -createdAt -updatedAt -__v -id -stripeCustomerId"
    )) as IUser;

    return updatedUser;
  }

  static async deleteMember(memberId: string) {
    if (!memberId) {
      throw new Error("Member ID is required");
    }

    const deletedUser = await User.findByIdAndDelete(memberId).select(
      "-password -createdAt -updatedAt -__v -id -stripeCustomerId"
    );

    if (!deletedUser) {
      throw new Error("Member not found or already deleted");
    }

    return true;
  }

  static async changeMemberPassword(payload: {
    userId: string;
    confirmPassword: string;
  }) {
    const { userId, confirmPassword } = payload;

    // Fetch only needed fields
    const user = await User.findById(userId, {
      roleType: 1,
      name: 1,
      password: 1,
      email: 1,
    });

    if (!user) throw new Error("User not found");

    // Restriction logic
    if (user.roleType === 0) {
      throw new Error("You cannot change password for Business User");
    }

    if (user.roleType === 1) {
      throw new Error("As you  cannot change password of admin");
    }

    // Encrypt and update password
    const hashedNewPassword = await PasswordEncrypt(confirmPassword);
    user.password = hashedNewPassword;

    const updatedUser = await user.save();

    // Exclude sensitive fields but keep necessary info
    const {
      password: _,
      createdAt,
      updatedAt,
      __v,
      stripeCustomerId,
      ...userSafe
    } = updatedUser.toObject();

    return userSafe;
  }

  static async getAllUsers(
    page: number = 1,
    limit: number = 10,
    searchParam?: string,
    roleType?: number, // Optional: specific role filter
    sortBy: string = "createdAt",
    sortOrder: "asc" | "desc" = "desc"
  ) {
    try {
      const query: any = {};

      // 🔹 Exclude roleType 0 and 1 by default
      query.roleType = { $nin: [0, 1] };

      // 🔹 If specific roleType filter is applied (like roleType=3)
      if (roleType !== undefined && roleType !== null) {
        query.roleType = roleType;
      }

      // 🔹 Search by name or email
      if (searchParam) {
        query.$or = [
          { name: { $regex: searchParam, $options: "i" } },
          { email: { $regex: searchParam, $options: "i" } },
        ];
      }

      const options: any = {
        page,
        limit,
        sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
        select: "-password", // exclude password for security
      };

      const users = await User.paginate(query, options);

      return {
        users: users.docs,
        pagination: {
          page: users.page,
          totalPages: users.totalPages,
          totalDocs: users.totalDocs,
          limit: users.limit,
        },
      };
    } catch (error: any) {
      console.error("Error fetching users:", error.message);
      throw new Error("Failed to fetch users");
    }
  }



  
}
