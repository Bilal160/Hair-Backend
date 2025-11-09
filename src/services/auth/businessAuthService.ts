import { IUser } from "../../interfaces/userInterface";
import { User } from "../../models/user";
import { PasswordEncrypt, PasswordMatch } from "../../utils/helperUtils";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/jwtUtils";
import { PasswordReset } from "../../models/passwordReset";
import { EmailVerification } from "../../models/emailVerificationsTokens";
import { checkStripeAccountStatus } from "../../utils/stripeInfoUtils";

export class BusinessAuthService {
  constructor(private readonly BusinessAuthService: BusinessAuthService) { }

  static async registerUser(user: IUser) {
    try {
      const hashedPassword = await PasswordEncrypt(user.password);
      const newUser = await User.create({
        ...user,
        password: hashedPassword,
      });

      const accessToken = await generateAccessToken(
        (newUser._id as any).toString(),
        newUser && newUser.roleType || 1
      );
      const refreshToken = await generateRefreshToken(
        (newUser._id as any).toString(),
        newUser && newUser.roleType || 1
      );

      const {
        password,
        createdAt,
        updatedAt,
        __v,

        ...userWithoutPassword
      } = newUser.toObject();

      return {
        accessToken: accessToken.accessToken,
        refreshToken: refreshToken.refreshToken,
        user: userWithoutPassword,
      };
    } catch (error) {
      throw new Error(`Failed to register user: ${error}`);
    }
  }

  static async loginUser(user: IUser, password: string) {
    console.log(user);
    const isPasswordValid = await PasswordMatch(password, user?.password);

    console.log(isPasswordValid);

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const accessToken = await generateAccessToken((user._id as any).toString(), user && user.roleType || 1);
    const refreshToken = await generateRefreshToken(
      (user._id as any).toString(),
      user && user.roleType || 1
    );

    const {
      password: _,
      createdAt,
      updatedAt,
      __v,

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
    })
      .select("-password -createdAt -updatedAt -__v -id -stripeCustomerId ")
      .populate("profilePhoto", "url key")) as IUser;

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

    const updatedUser = await user.save();

    const {
      password: _,
      createdAt,
      updatedAt,
      __v,

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
      console.log(error, "error in userByEmail");
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
      const user = await User.findOne({ email }).populate({
        path: "profilePhoto",
        select: "url key",
      });
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
        "-password -createdAt -updatedAt -__v -id -stripeCustomerId "
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

  static async saveEmailToken(
    email: string,
    verificationCode: string,
    expireAt: Date
  ) {
    try {
      return await EmailVerification.findOneAndUpdate(
        { email },
        { $set: { email, verificationCode, expireAt } },
        { new: true, upsert: true }
      );
    } catch (error) {
      throw new Error(`Failed to save token: ${error}`);
    }
  }

  static async getEmailVerificationCode(verificationCode: string) {
    try {
      const verificationCodeData = await EmailVerification.findOne({
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

  static async verifyUser(payload: { userId: string }) {
    try {
      const { userId } = payload;
      const user = await User.findById(userId);
      if (!user) throw new Error("User not found");

      user.isVerified = true;
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
      throw new Error(`Failed to verify user: ${error}`);
    }
  }

  static async formattedData(data: any) {
    try {
      console.log("Raw incoming data keys:", Object.keys(data));

      // 🔹 Normalize keys (trim whitespace)
      const cleanedData: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        cleanedData[key.trim()] = value;
      }

      // 🔹 Only allow specific fields
      const payload: Record<string, any> = {};
      const fields = ["name", "email", "phone", "removePhoto"];

      for (const key of fields) {
        const value = cleanedData[key];
        if (value !== undefined && value !== "" && value !== null) {
          payload[key] = value;
        }
      }

      return payload;
    } catch (error) {
      console.error("Error formatting data:", error);
      throw new Error("Failed to format data");
    }
  }

  static async createformattedData(data: any) {
    console.log("Received data for formatting:", data);

    console.log("Raw incoming data keys:", Object.keys(data));
    try {
      const cleanedData: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        cleanedData[key.trim()] = value;
      }

      console.log("Cleaned Data:", cleanedData);

      // Prepare businessLocation object
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

      // Group business info
      const businessInfo = {
        businessName: cleanedData.businessName,
        businessDescription: cleanedData.businessDescription,
        operatingHours: cleanedData.operatingHours,
        operatingDays: cleanedData.operatingHours,
        phone: cleanedData.businessPhone,
        businessLocation,
      };

      // Return formatted payload
      return {
        email: cleanedData.email,
        name: cleanedData.name,
        password: cleanedData.password,
        confirmPassword: cleanedData.confirmPassword,
        phone: cleanedData.phone,
        businessInfo,
      };
    } catch (error) {
      throw new Error("Failed to format data");
    }
  }

  static async getExistingPhoto(userId: string) {
    try {
      const user = await User.findById(userId)
        .select("profilePhotoId")
        .populate({
          path: "profilePhoto",
          select: "url key _id",
        });
      // Return the profilePhoto field (could be null if not set)
      return user;
    } catch (error) {
      throw new Error("Failed to get existing photo");
    }
  }

  static async setupConnectAccount(payload: { userId: string, stripeAccountId: string, stripeOnboardingUrl: string }) {
    try {
      const { userId, stripeAccountId, stripeOnboardingUrl } = payload;
      const user = await User.findById(userId);
      if (!user) throw new Error("User not found");
      user.stripeAccountId = stripeAccountId;
      user.stripeOnboardingUrl = stripeOnboardingUrl;
      await user.save();

      const {
        password: _,
        createdAt,
        updatedAt,
        __v,
        ...userSafe
      } = user.toObject();

      return userSafe;
    } catch (error) {
      throw new Error("Failed to setup connect account");
    }
  }


  static async updateVerificationStatus(payload: { stripeAccountId: string }) {
    try {
      const { stripeAccountId } = payload;

      // 1️⃣ Find user by stripeAccountId
      const user = await User.findOne({ stripeAccountId });
      if (!user) throw new Error("User not found");

      // 2️⃣ Get latest verification status from Stripe
      const verification = await checkStripeAccountStatus(stripeAccountId);

      // 3️⃣ Update user fields
      user.stripeAccountVerified = verification.stripeAccountVerified;
      user.stripePayoutEnabled = verification.stripePayoutEnabled;
      user.stripeDetailEnabled = verification.stripeDetailEnabled;
      user.stripeChargesEnabled = verification.stripeChargesEnabled;

      await user.save();

      // 4️⃣ Return sanitized user object
      const { password, __v, createdAt, updatedAt, ...userSafe } = user.toObject();
      return userSafe;

    } catch (error: any) {
      console.error("Failed to update Stripe verification status:", error);
      throw new Error(error?.message || "Failed to update verification status");
    }
  }



}
