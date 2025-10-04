import { Request, Response } from "express";
import { IUser } from "../../interfaces/userInterface";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  userCreateSchema,
  verifyCodeSchema,
} from "../../validations/userValidation";
import { generateToken, handleValidationErrors } from "../../utils/helperUtils";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../utils/responseUtils";
import { BusinessAuthService} from "../../services/auth/businessAuthService";
import {
  destroyRedisClientToken,
  getRedisClientTokenDetail,
} from "../../utils/redisUtils";
import { sendMail } from "../../utils/emailUtils";
import { handlePhotoUpload } from "../../utils/imagesUtils";
import { Types } from "mongoose";
import { ImagesService } from "../../services/imagesService";

export class BusinessAuthController {
  constructor(private readonly userService: IUser) { }

  static async RegisterUser(req: Request, res: Response) {
    const { email, name, password, confirmPassword, phone, roleType } = req.body;
    try {
      const result = await userCreateSchema.safeParse(req.body);
      if (!result.success) {
        const errorMessage = handleValidationErrors(result.error);
        return sendErrorResponse(
          res,
          [`Validation Error: ${errorMessage}`],
          400
        );
      }

      const userExists = await BusinessAuthService.userExists(email);
      if (userExists) {
        return sendErrorResponse(
          res,
          [`Email already registered try with different email`],
          400
        );
      }


      console.log(result?.data, "result?.data");
      const user = await BusinessAuthService.registerUser({
        ...result?.data,
        roleType: 1,
      } as IUser)








      return sendSuccessResponse(
        res,
        [`User registered successfully`],
        { data: user },
        201
      );
    } catch (error) {
      return sendErrorResponse(res, [`Internal Server Error: ${error}`], 500);
    }
  }

  static async LoginUser(req: Request, res: Response) {
    const { email, password } = req.body;

    try {
      const user = (await BusinessAuthService.userByEmailWithPassword(email)) as IUser;

      console.log(user, "user");

      if (!user) {
        return sendErrorResponse(res, ["User not found"], 404);
      }



      const loginResult = await BusinessAuthService.loginUser(user, password);




      return sendSuccessResponse(
        res,
        ["User logged in successfully"],
        { data: loginResult },
        200
      );
    } catch (error: any) {
      if (error?.message == "Invalid credentials") {
        return sendErrorResponse(res, [`Invalid credentials`], 400);
      }

      return sendErrorResponse(res, [`Internal Server Error: ${error}`], 500);
    }
  }
static async UpdateUser(req: Request, res: Response) {
  const userId = req.userId;

  const formattedData = await BusinessAuthService.formattedData({
    ...req.body,
  });

  console.log(formattedData, "formattedData");
  try {
    let profilePhotoId: string | null = null;

    if (formattedData.removePhoto == "true") {
      const existingPhoto = await BusinessAuthService.getExistingPhoto(userId);
      console.log(existingPhoto, "existingPhoto");

      const photoId = existingPhoto?.profilePhotoId;
      let photoKey: string | undefined = undefined;
      if (photoId) {
        const photoDoc = await ImagesService.getPhotoById(photoId as any);
        photoKey = photoDoc?.key;
      }

      if (photoKey && photoId) {
        const deletedPhoto = await ImagesService.deletePhotoById(photoId as any, photoKey);
        console.log(deletedPhoto, "deletedPhoto");
        // Set profilePhotoId to null after deletion
        profilePhotoId = null;
      }
    }

    const profilePhotos = (req.files as any)?.profilePhoto;

    if (profilePhotos && profilePhotos.length > 0) {
      const existingPhoto = await BusinessAuthService.getExistingPhoto(userId);
      const photoId = existingPhoto?.profilePhotoId;
      let photoKey: string | undefined = undefined;
      if (photoId) {
        const photoDoc = await ImagesService.getPhotoById(photoId as any);
        photoKey = photoDoc?.key;
      }

      if (photoKey && photoId) {
        const deletedPhoto = await ImagesService.deletePhotoById(photoId as any, photoKey);
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

  static async ChangePassword(req: Request, res: Response) {
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

  static async forgotPassword(req: Request, res: Response) {
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

      const verificationToken = await generateToken().toString();
      await sendMail(2, email, verificationToken || "", `${userInfo.name}`);
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

      await BusinessAuthService.saveEmailToken(email, verificationToken, expireAt);
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

  static async resetPassword(req: Request, res: Response) {
    const { verificationCode, password, confirmPassword } = req.body;
    const result = await resetPasswordSchema.safeParse(req.body);

    if (!result.success) {
      const errorMessage = handleValidationErrors(result.error);
      return sendErrorResponse(res, [`Validation Error: ${errorMessage}`], 400);
    }

    try {
      const verificationCodeData = await BusinessAuthService.getVerificationCode(
        verificationCode
      );
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
      const verificationCodeData = await BusinessAuthService.getVerificationCode(
        verificationCode
      );
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
      const verificationCodeData = await BusinessAuthService.getEmailVerificationCode(verificationCode);
      if (!verificationCodeData) {
        return sendErrorResponse(res, ["Invalid or expired verification code"], 400);
      }

      // fetch user


      // verify user
      const updatedUser = await BusinessAuthService.verifyUser({ userId: userId });

      return sendSuccessResponse(
        res,
        ["Email verified successfully"],
        { user: updatedUser },
        200
      );
    } catch (error: any) {
      if (error?.message?.includes("Verification code expired")) {
        return sendErrorResponse(res, ["Verification code expired, please try with a new code"], 400);
      }
      if (error?.message?.includes("Verification code not found")) {
        return sendErrorResponse(res, ["Invalid verification code, please try with a new code"], 400);
      }
      if (error?.message?.includes("Invalid verification code")) {
        return sendErrorResponse(res, ["Invalid verification code"], 400);
      }
      if (error?.message?.includes("User not found")) {
        return sendErrorResponse(res, ["User not found"], 404);
      }

      return sendErrorResponse(res, [`Internal Server Error: ${error.message || error}`], 500);
    }
  }

}


