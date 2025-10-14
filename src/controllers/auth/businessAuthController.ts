import { Request, Response } from "express";
import { IUser } from "../../interfaces/userInterface";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  userCreateSchema,
  verifyCodeSchema,
} from "../../validations/userValidation";
import { BusinessProfileService } from "../../services/businessProfile/businessProfile";
import { generateToken, handleValidationErrors } from "../../utils/helperUtils";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../utils/responseUtils";
import { BusinessAuthService } from "../../services/auth/businessAuthService";
import {
  destroyRedisClientToken,
  getRedisClientTokenDetail,
} from "../../utils/redisUtils";
import { sendMail } from "../../utils/emailUtils";
import { handlePhotoUpload } from "../../utils/imagesUtils";
import { Types } from "mongoose";
import { ImagesService } from "../../services/imagesService";
import { signUpBusinessUser } from "../../validations/signUpBusinessValidation";
import { createStripeCustomer } from "../../utils/stripeInfoUtils";
import { PaymentService } from "../../services/payment/paymentService";

export class BusinessAuthController {
  constructor(private readonly userService: IUser) {}

  static async RegisterBusinessUser(req: Request, res: Response) {
    console.log("Request Body:", req.body);
    console.log("Request Files:", req.files);
    const formattedData = await BusinessAuthService.createformattedData({
      ...req.body,
    });

    try {
      const result = await signUpBusinessUser.safeParse(formattedData);

      if (!result.success) {
        const errorMessage = handleValidationErrors(result.error);
        return sendErrorResponse(
          res,
          [`Validation Error: ${errorMessage}`],
          400
        );
      }

      const stripeCustomer = await createStripeCustomer({
        email: result.data.email,
        name: result.data.name,
      });

      const userExists = await BusinessAuthService.userExists(
        result.data.email
      );
      if (userExists) {
        return sendErrorResponse(
          res,
          [`Email already registered try with different email`],
          400
        );
      }

      // 1. Register user (only user fields)
      const user = await BusinessAuthService.registerUser({
        name: result.data.name,
        email: result.data.email,
        password: result.data.password,
        phone: result.data.phone,
        roleType: 1,
        stripeCustomerId: stripeCustomer?.id || "",
      } as IUser);

      // 2. Prepare business profile data
      let businessPhotos = (req.files as any)?.businessPhotos;
      let businessNICPhoto = (req.files as any)?.businessNICPhoto;
      let businessRegistrationDoc = (req.files as any)?.businessRegistrationDoc;
      let businessFeaturedImage = (req.files as any)?.businessFeaturedImage;

      let businessPhotosIds: Types.ObjectId[] = [];
      let businessNICPhotoIds: Types.ObjectId[] = [];
      let businessRegistrationDocId: Types.ObjectId | null = null;
      let businessFeaturedImageId: Types.ObjectId | null = null;

      if (businessPhotos && businessPhotos.length > 0) {
        const uploadedIds = await handlePhotoUpload(
          Array.isArray(businessPhotos) ? businessPhotos : [businessPhotos],
          "businessPhotos"
        );
        if (uploadedIds && Array.isArray(uploadedIds)) {
          businessPhotosIds = (uploadedIds as string[]).map(
            (id) => new Types.ObjectId(id)
          );
        }
      }

      if (businessNICPhoto && businessNICPhoto.length > 0) {
        const uploadedIds = await handlePhotoUpload(
          Array.isArray(businessNICPhoto)
            ? businessNICPhoto
            : [businessNICPhoto],
          "businessNICPhoto"
        );
        if (uploadedIds && Array.isArray(uploadedIds)) {
          businessNICPhotoIds = (uploadedIds as string[]).map(
            (id) => new Types.ObjectId(id)
          );
        }
      }
      if (businessRegistrationDoc && businessRegistrationDoc.length > 0) {
        const uploadedIds = await handlePhotoUpload(
          Array.isArray(businessRegistrationDoc)
            ? businessRegistrationDoc
            : [businessRegistrationDoc],
          "businessRegistrationDoc"
        );
        if (
          uploadedIds &&
          Array.isArray(uploadedIds) &&
          uploadedIds.length > 0
        ) {
          businessRegistrationDocId = new Types.ObjectId(uploadedIds[0]);
        }
      }
      if (businessFeaturedImage && businessFeaturedImage.length > 0) {
        const uploadedIds = await handlePhotoUpload(
          Array.isArray(businessFeaturedImage)
            ? businessFeaturedImage
            : [businessFeaturedImage],
          "businessFeaturedImage"
        );
        if (
          uploadedIds &&
          Array.isArray(uploadedIds) &&
          uploadedIds.length > 0
        ) {
          businessFeaturedImageId = new Types.ObjectId(uploadedIds[0]);
        }
      }

      // 3. Create business profile (link to user._id)
      const businessProfile =
        await BusinessProfileService.createBusinessProfile({
          userId: user?.user?._id,
          ...result.data.businessInfo, // assuming businessInfo object contains business fields
          businessPhotosIds,
          businessNICPhotoIds,
          businessRegistrationDocId,
          businessFeaturedImageId,
        } as any);

      return sendSuccessResponse(
        res,
        [`User and business profile registered successfully`],
        { user, businessProfile },
        201
      );
    } catch (error) {
      return sendErrorResponse(res, [`Internal Server Error: ${error}`], 500);
    }
  }
  static async LoginBusinessUser(req: Request, res: Response) {
    const { email, password } = req.body;

    try {
      const user = (await BusinessAuthService.userByEmailWithPassword(
        email
      )) as IUser;

      console.log(user, "user");

      if (!user) {
        return sendErrorResponse(res, ["User not found"], 404);
      }

      if (user.roleType !== 1) {
        return sendErrorResponse(
          res,
          [
            "You are not a business user kindly register yourself as a business user",
          ],
          400
        );
      }

      const loginResult = await BusinessAuthService.loginUser(user, password);

      const businessProfile = await BusinessProfileService.getBusinessProfile(
        (loginResult?.user?._id as any).toString()
      );

      const subscriptionInfo = await PaymentService.getSubscriptionByUserId(
        (loginResult?.user?._id as any).toString()
      );

      // Expecting loginResult = { accessToken, refreshToken, user }
      return sendSuccessResponse(
        res,
        ["Business user logged in successfully"],
        {
          data: loginResult,
          businessProfile: businessProfile,
          subscription: subscriptionInfo,
        },
        200
      );
    } catch (error: any) {
      if (error?.message == "Invalid credentials") {
        return sendErrorResponse(res, [`Invalid credentials`], 400);
      }

      console.log(error, "error in login business user");
      return sendErrorResponse(res, [`Internal Server Error: ${error}`], 500);
    }
  }
  static async UpdateBusinessUser(req: Request, res: Response) {
    const userId = req.userId;

    const formattedData = await BusinessAuthService.formattedData({
      ...req.body,
    });

    console.log(formattedData, "formattedData");
    try {
      let profilePhotoId: string | null = null;

      if (formattedData.removePhoto == "true") {
        const existingPhoto = await BusinessAuthService.getExistingPhoto(
          userId
        );
        console.log(existingPhoto, "existingPhoto");

        const photoId = existingPhoto?.profilePhotoId;
        let photoKey: string | undefined = undefined;
        if (photoId) {
          const photoDoc = await ImagesService.getPhotoById(photoId as any);
          photoKey = photoDoc?.key;
        }

        if (photoKey && photoId) {
          const deletedPhoto = await ImagesService.deletePhotoById(
            photoId as any,
            photoKey
          );
          console.log(deletedPhoto, "deletedPhoto");
          // Set profilePhotoId to null after deletion
          profilePhotoId = null;
        }
      }

      const profilePhotos = (req.files as any)?.profilePhoto;

      if (profilePhotos && profilePhotos.length > 0) {
        const existingPhoto = await BusinessAuthService.getExistingPhoto(
          userId
        );
        const photoId = existingPhoto?.profilePhotoId;
        let photoKey: string | undefined = undefined;
        if (photoId) {
          const photoDoc = await ImagesService.getPhotoById(photoId as any);
          photoKey = photoDoc?.key;
        }

        if (photoKey && photoId) {
          const deletedPhoto = await ImagesService.deletePhotoById(
            photoId as any,
            photoKey
          );
          console.log(deletedPhoto, "deletedPhoto");
        }

        const uploadedId = await handlePhotoUpload(
          Array.isArray(profilePhotos) ? profilePhotos : [profilePhotos],
          "images"
        );
        if (uploadedId && Array.isArray(uploadedId)) {
          profilePhotoId = uploadedId[0];
        } else if (uploadedId) {
          profilePhotoId = uploadedId;
        }
      }

      const updatedData = {
        name: formattedData.name,
        email: formattedData.email,
        phone: formattedData.phoneNumber,
        userId,
        profilePhotoId: profilePhotoId
          ? new (require("mongoose").Types.ObjectId)(profilePhotoId)
          : null, // will be null if deleted
      };

      const user = await BusinessAuthService.updateUser(updatedData);
      return sendSuccessResponse(
        res,
        ["User updated successfully"],
        { user: user },
        200
      );
    } catch (error) {
      return sendErrorResponse(res, [`Internal Server Error: ${error}`], 500);
    }
  }

  static async ChangePasswordForBusiness(req: Request, res: Response) {
    const userId = req.userId;
    const { password, newPassword, confirmPassword } = req.body;
    try {
      const result = await changePasswordSchema.safeParse(req.body);
      if (!result.success) {
        const errorMessage = handleValidationErrors(result.error);
        return sendErrorResponse(
          res,
          [`Validation Error: ${errorMessage}`],
          400
        );
      }

      const updatedData = {
        password,
        newPassword,
        confirmPassword,
        userId,
      };

      const user = await BusinessAuthService.changePassword(updatedData);

      return sendSuccessResponse(
        res,
        ["Password changed successfully"],
        { user: user },
        200
      );
    } catch (error: any) {
      if (error?.message == "User not found") {
        return sendErrorResponse(res, [`User not found`], 404);
      }

      if (error?.message == "Your old password is incorrect") {
        return sendErrorResponse(res, [`Your old password is incorrect`], 400);
      }

      return sendErrorResponse(res, [`Internal Server Error: ${error}`], 500);
    }
  }

  static async sessionValidation(req: Request, res: Response) {
    const token = req.token;
    try {
      const checkSession = await getRedisClientTokenDetail(token);

      if (checkSession) {
        return sendSuccessResponse(
          res,
          ["Session validated successfully"],
          {},
          200
        );
      } else {
        return sendErrorResponse(
          res,
          ["Session expired please login again"],
          401
        );
      }
    } catch (error) {
      return sendErrorResponse(res, [`Internal Server Error: ${error}`], 500);
    }
  }

  static async logoutUser(req: Request, res: Response) {
    try {
      const token = req.token;

      await destroyRedisClientToken(token);

      return sendSuccessResponse(
        res,
        ["User logged out successfully"],
        {},
        200
      );
    } catch (error) {
      return sendErrorResponse(res, [`Internal Server Error: ${error}`], 500);
    }
  }

  static async forgotPasswordForBusiness(req: Request, res: Response) {
    const { email } = req.body;
    const result = await forgotPasswordSchema.safeParse(req.body);
    if (!result.success) {
      const errorMessage = handleValidationErrors(result.error);
      return sendErrorResponse(res, [`Validation Error: ${errorMessage}`], 400);
    }
    console.log(email, "email");
    try {
      let userInfo = await BusinessAuthService.userByEmail(email);
      if (!userInfo) {
        return sendErrorResponse(res, ["User not found"], 404);
      }

      console.log(userInfo, "userInfo");

      if (userInfo.roleType !== 1) {
        return sendErrorResponse(
          res,
          [
            "You are not a business user kindly register yourself as a business user",
          ],
          400
        );
      }
      const verificationToken = await generateToken().toString();
      //   await sendMail(2, email, verificationToken || "", `${userInfo.name} `);
      const expireAt = new Date(Date.now() + 30 * 60000);

      await BusinessAuthService.saveToken(email, verificationToken, expireAt);
      return sendSuccessResponse(
        res,
        ["Password reset email sent successfully"],
        {},
        200
      );
    } catch (error: any) {
      if (error?.message == "User not found") {
        return sendErrorResponse(res, ["User not found"], 404);
      }

      return sendErrorResponse(res, [`Internal Server Error: ${error}`], 500);
    }
  }

  static async sendVerificationEmail(req: Request, res: Response) {
    const { email } = req.body;
    const result = await forgotPasswordSchema.safeParse(req.body);
    if (!result.success) {
      const errorMessage = handleValidationErrors(result.error);
      return sendErrorResponse(res, [`Validation Error: ${errorMessage}`], 400);
    }

    try {
      let userInfo = await BusinessAuthService.userByEmail(email);
      if (!userInfo) {
        return sendErrorResponse(res, ["User not found"], 404);
      }

      console.log(userInfo, "userInfo");

      const verificationToken = await generateToken().toString();
      await sendMail(1, email, verificationToken || "", `${userInfo.name}`);
      const expireAt = new Date(Date.now() + 30 * 60000);

      await BusinessAuthService.saveEmailToken(
        email,
        verificationToken,
        expireAt
      );
      return sendSuccessResponse(
        res,
        ["Please Check Your Email for Verification Code"],
        {},
        200
      );
    } catch (error: any) {
      if (error?.message == "User not found") {
        return sendErrorResponse(res, ["User not found"], 404);
      }

      return sendErrorResponse(res, [`Internal Server Error: ${error}`], 500);
    }
  }

  static async resetPasswordForBusiness(req: Request, res: Response) {
    const { verificationCode, password, confirmPassword } = req.body;
    const result = await resetPasswordSchema.safeParse(req.body);

    if (!result.success) {
      const errorMessage = handleValidationErrors(result.error);
      return sendErrorResponse(res, [`Validation Error: ${errorMessage}`], 400);
    }

    try {
      const verificationCodeData =
        await BusinessAuthService.getVerificationCode(verificationCode);
      if (!verificationCodeData) {
        return sendErrorResponse(
          res,
          ["Invalid  Or Expired  verification code"],
          400
        );
      }

      const user = (await BusinessAuthService.userByEmail(
        verificationCodeData.email
      )) as IUser;
      if (!user) {
        return sendErrorResponse(res, ["User not found"], 404);
      }
      const userId = user?._id?.toString() || "";

      const updatedUser = await BusinessAuthService.updatePassword({
        userId,
        password,
      });
      return sendSuccessResponse(
        res,
        ["Password updated successfully"],
        { user: updatedUser },
        200
      );
    } catch (error: any) {
      if (error?.message == "Invalid verification code") {
        return sendErrorResponse(res, ["Invalid verification code"], 400);
      }
      if (error?.message == "User not found") {
        return sendErrorResponse(res, ["User not found"], 404);
      }

      if (error?.message == "Verification code expired") {
        return sendErrorResponse(
          res,
          ["Verification code expired please try with new code"],
          400
        );
      }
      if (error?.message == "Verification code not found") {
        return sendErrorResponse(
          res,
          ["Invalid verification code please try with new code"],
          400
        );
      }
      return sendErrorResponse(res, [`Internal Server Error: ${error}`], 500);
    }
  }

  static async verifyCode(req: Request, res: Response) {
    const { verificationCode } = req.body;

    if (!verificationCode) {
      return sendErrorResponse(res, ["Verification code is required"], 400);
    }
    try {
      const verificationCodeData =
        await BusinessAuthService.getVerificationCode(verificationCode);
      if (!verificationCodeData) {
        return sendErrorResponse(res, ["Invalid verification code"], 400);
      }
      return sendSuccessResponse(res, ["Verification code verified"], {}, 200);
    } catch (error: any) {
      if (error?.message == "Verification code not found") {
        return sendErrorResponse(
          res,
          ["Invalid verification code please try with new code"],
          400
        );
      }
      if (error?.message == "Verification code expired") {
        return sendErrorResponse(
          res,
          ["Verification code expired please try with new code"],
          400
        );
      }
      if (error?.message == "Invalid verification code") {
        return sendErrorResponse(
          res,
          ["Invalid verification code please try with new code"],
          400
        );
      }

      return sendErrorResponse(res, [`Internal Server Error: ${error}`], 500);
    }
  }

  static async verifyEmail(req: Request, res: Response) {
    const userId = req.userId;
    const result = await verifyCodeSchema.safeParse(req.body);

    if (!result.success) {
      const errorMessage = handleValidationErrors(result.error);
      return sendErrorResponse(res, [`Validation Error: ${errorMessage}`], 400);
    }

    const { verificationCode } = req.body;

    try {
      // fetch verification code record
      const verificationCodeData =
        await BusinessAuthService.getEmailVerificationCode(verificationCode);
      if (!verificationCodeData) {
        return sendErrorResponse(
          res,
          ["Invalid or expired verification code"],
          400
        );
      }

      // fetch user

      // verify user
      const updatedUser = await BusinessAuthService.verifyUser({
        userId: userId,
      });

      return sendSuccessResponse(
        res,
        ["Email verified successfully"],
        { user: updatedUser },
        200
      );
    } catch (error: any) {
      if (error?.message?.includes("Verification code expired")) {
        return sendErrorResponse(
          res,
          ["Verification code expired, please try with a new code"],
          400
        );
      }
      if (error?.message?.includes("Verification code not found")) {
        return sendErrorResponse(
          res,
          ["Invalid verification code, please try with a new code"],
          400
        );
      }
      if (error?.message?.includes("Invalid verification code")) {
        return sendErrorResponse(res, ["Invalid verification code"], 400);
      }
      if (error?.message?.includes("User not found")) {
        return sendErrorResponse(res, ["User not found"], 404);
      }

      return sendErrorResponse(
        res,
        [`Internal Server Error: ${error.message || error}`],
        500
      );
    }
  }
}
