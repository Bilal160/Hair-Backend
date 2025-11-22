import { Request, Response } from "express";
import { IUser } from "../../interfaces/userInterface";
import {
  addRoleBaseUser,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  userCreateSchema,
  usersQuerySchema,
} from "../../validations/userValidation";

import { generateToken, handleValidationErrors } from "../../utils/helperUtils";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../utils/responseUtils";
import { AuthService } from "../../services/auth/authServices";
import {
  destroyRedisClientToken,
  getRedisClientTokenDetail,
} from "../../utils/redisUtils";
import { sendMail } from "../../utils/emailUtils";
import { AdminAuthService } from "../../services/auth/adminAuthServices";
import { changeUserPasswordByAdminSchema } from "../../validations/changeUserPasswordByAdmin";

export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) { }

  static async LoginAdminUser(req: Request, res: Response) {
    const { email, password } = req.body;

    // Admin Auth

    try {
      const user = (await AdminAuthService.userByEmailWithPassword(
        email
      )) as IUser;

      console.log(user, "user");

      if (!user) {
        return sendErrorResponse(res, ["User not found"], 404);
      }

      if (user.roleType !== 2) {
        return sendErrorResponse(
          res,
          ["You are not Registered as a admin"],
          400
        );
      }

      const loginResult = await AdminAuthService.loginAdminUser(user, password);

      return sendSuccessResponse(
        res,
        ["Admin logged in successfully"],
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

  static async UpdateAdminUser(req: Request, res: Response) {
    const userId = req.userId;
    const roleType = req.roleType;

    if (roleType !== 2) {
      return sendErrorResponse(
        res,
        ["You are not authorized to update admin user"],
        403
      );
    }

    const { email, name } = req.body;
    try {
      const updatedData = {
        name,
        email,
        userId,
      };

      const user = await AdminAuthService.updateUser(updatedData);
      return sendSuccessResponse(
        res,
        ["Admin updated successfully"],
        { user: user },
        200
      );
    } catch (error) {
      return sendErrorResponse(res, [`Internal Server Error: ${error}`], 500);
    }
  }

  static async ChangeAdminPassword(req: Request, res: Response) {
    const userId = req.userId;
    const roleType = req.roleType;

    const { password, newPassword, confirmPassword } = req.body;
    try {
      if (roleType !== 2) {
        return sendErrorResponse(
          res,
          ["You are not authorized to change admin password"],
          403
        );
      }

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

      const user = await AdminAuthService.changePassword(updatedData);

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
  //   static async sessionValidation(req: Request, res: Response) {
  //     const token = req.token;
  //     try {
  //       const checkSession = await getRedisClientTokenDetail(token);

  //       if (checkSession) {
  //         return sendSuccessResponse(
  //           res,
  //           ["Session validated successfully"],
  //           {},
  //           200
  //         );
  //       } else {
  //         return sendErrorResponse(
  //           res,
  //           ["Session expired please login again"],
  //           401
  //         );
  //       }
  //     } catch (error) {
  //       return sendErrorResponse(res, [`Internal Server Error: ${error}`], 500);
  //     }
  //   }

  //   static async logoutUser(req: Request, res: Response) {
  //     try {
  //       const token = req.token;

  //       await destroyRedisClientToken(token);

  //       return sendSuccessResponse(
  //         res,
  //         ["User logged out successfully"],
  //         {},
  //         200
  //       );
  //     } catch (error) {
  //       return sendErrorResponse(res, [`Internal Server Error: ${error}`], 500);
  //     }
  //   }

  static async forgotAdminPassword(req: Request, res: Response) {
    const { email } = req.body;
    const result = await forgotPasswordSchema.safeParse(req.body);
    if (!result.success) {
      const errorMessage = handleValidationErrors(result.error);
      return sendErrorResponse(res, [`Validation Error: ${errorMessage}`], 400);
    }
    console.log(email, "email");
    try {
      let userInfo = await AdminAuthService.userByEmail(email);
      if (!userInfo) {
        return sendErrorResponse(res, ["User not found"], 404);
      }

      console.log(userInfo, "userInfo");

      if (userInfo?.roleType !== 2) {
        return sendErrorResponse(
          res,
          ["You are not authorized to reset admin password"],
          403
        );
      }

      const verificationToken = await generateToken().toString();
      await sendMail(2, email, verificationToken || "", `${userInfo.name}`);
      const expireAt = new Date(Date.now() + 30 * 60000);

      await AdminAuthService.saveToken(email, verificationToken, expireAt);
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

  static async resetAdminPassword(req: Request, res: Response) {
    const { verificationCode, password, confirmPassword } = req.body;
    const result = await resetPasswordSchema.safeParse(req.body);

    if (!result.success) {
      const errorMessage = handleValidationErrors(result.error);
      return sendErrorResponse(res, [`Validation Error: ${errorMessage}`], 400);
    }

    try {
      const verificationCodeData = await AdminAuthService.getVerificationCode(
        verificationCode
      );
      if (!verificationCodeData) {
        return sendErrorResponse(
          res,
          ["Invalid  Or Expired  verification code"],
          400
        );
      }

      const user = (await AuthService.userByEmail(
        verificationCodeData.email
      )) as IUser;
      if (!user) {
        return sendErrorResponse(res, ["User not found"], 404);
      }
      const userId = user?._id?.toString() || "";

      if (user?.roleType !== 2) {
        return sendErrorResponse(
          res,
          ["You are not authorized to reset admin password"],
          403
        );
      }
      const updatedUser = await AdminAuthService.updatePassword({
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

  // static async googleLoginController(req: Request, res: Response) {
  //   try {
  //     const { idToken } = req.body;

  //     if (!idToken) {
  //       return sendErrorResponse(res, ["Id Token is Required"], 400);
  //     }

  //     let user = await AuthService.googleLoginServiceForUser(idToken, 0);
  //     if (!user) {
  //       return sendErrorResponse(res, ["Failed to process Google login"], 500);
  //     }

  //     return sendSuccessResponse(
  //       res,
  //       ["Login with Google Successful"],
  //       { data: user },
  //       200
  //     );
  //   } catch (error: any) {
  //     console.error("Google Login Error:", error);
  //     if (error?.message == "Not  a User") {
  //       return sendErrorResponse(
  //         res,
  //         [
  //           "You are not user kindly regeister your Self as User and then login ",
  //         ],
  //         400
  //       );
  //     }

  //     return sendErrorResponse(res, [`Internal Server Error: ${error}`], 500);
  //   }
  // }

  // static async changeUserPasswordByAdmin(req: Request, res: Response) {
  //   const userId = req.params.id;
  //   const { password, confirmPassword } = req.body;
  //   const result = await changeUserPasswordByAdminSchema.safeParse({
  //     userId,
  //     password,
  //     confirmPassword,
  //   });
  //   if (!result.success) {
  //     const errorMessage = handleValidationErrors(result.error);
  //     return sendErrorResponse(res, [`Validation Error: ${errorMessage}`], 400);
  //   }

  //   try {
  //     const user = await AdminAuthService.changeUserPasswordByAdmin({
  //       userId,
  //       confirmPassword,
  //     });
  //     return sendSuccessResponse(
  //       res,
  //       ["Password changed successfully"],
  //       { user: user },
  //       200
  //     );
  //   } catch (error: any) {
  //     if (error?.message == "User not found") {
  //       return sendErrorResponse(res, ["User not found"], 404);
  //     }
  //     return sendErrorResponse(res, [`Internal Server Error: ${error}`], 500);
  //   }
  // }

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



  static async adminRoleUser(req: Request, res: Response) {
    const { email, name, password, confirmPassword, roleType } = req.body;
    try {
      const result = await addRoleBaseUser.safeParse(req.body);
      if (!result.success) {
        const errorMessage = handleValidationErrors(result.error);
        return sendErrorResponse(
          res,
          [`Validation Error: ${errorMessage}`],
          400
        );
      }

      const userExists = await AuthService.userExists(email);
      if (userExists) {
        return sendErrorResponse(
          res,
          [`Email already registered try with different email`],
          400
        );
      }

      const user = await AdminAuthService.addRoleUser({
        ...result?.data,
      } as IUser);

      console.log(user, "Comming")
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

  static async UpdateMemeber(req: Request, res: Response) {
    const memberId = req.params.id;
    const adminroleType = req.roleType;


    if (adminroleType !== 1) {
      return sendErrorResponse(
        res,
        ["You are not authorized to update Memeber Detail"],
        403
      );
    }

    const { email, name, roleType } = req.body;

    if (!memberId || memberId.length === 0) {
      return sendErrorResponse(res, [`MemberId is Required`], 400);
    }
    try {
      const updatedData = {
        name,
        email,
        memberId,
        roleType,
      };

      const user = await AdminAuthService.updateMember(updatedData);
      return sendSuccessResponse(
        res,
        ["Member Updated Successfully"],
        { user: user },
        200
      );
    } catch (error) {
      return sendErrorResponse(res, [`Internal Server Error: ${error}`], 500);
    }
  }
  static async changeUserPasswordByAdmin(req: Request, res: Response) {
    const userId = req.params.id;
    const { password, confirmPassword } = req.body;
    const result = await changeUserPasswordByAdminSchema.safeParse({
      userId,
      password,
      confirmPassword,
    });
    if (!result.success) {
      const errorMessage = handleValidationErrors(result.error);
      return sendErrorResponse(res, [`Validation Error: ${errorMessage}`], 400);
    }

    try {
      const user = await AdminAuthService.changeMemberPassword({
        userId,
        confirmPassword,
      });
      return sendSuccessResponse(
        res,
        ["Password changed successfully"],
        { user: user },
        200
      );
    } catch (error: any) {
      if (error?.message == "User not found") {
        return sendErrorResponse(res, ["User not found"], 404);
      }
      return sendErrorResponse(res, [`Internal Server Error: ${error}`], 500);
    }
  }



  static async getAllMembers(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        searchParam = "",
        sortBy = "createdAt",
        sortOrder = "desc",
        roleType,
      } = req.query;

      // ✅ Validate query params using Zod schema
      const queryResult = usersQuerySchema.safeParse({
        page: Number(page),
        limit: Number(limit),
        searchParam,
        sortBy,
        sortOrder,
        roleType: roleType ? Number(roleType) : undefined,
      });

      if (!queryResult.success) {
        const errorMessage = handleValidationErrors(queryResult.error);
        return sendErrorResponse(res, [`Validation Error: ${errorMessage}`], 400);
      }

      // ✅ Fetch users from service
      const users = await AdminAuthService.getAllUsers(
        queryResult.data.page,
        queryResult.data.limit,
        queryResult.data.searchParam,
        queryResult.data.roleType,
        queryResult.data.sortBy,
        queryResult.data.sortOrder
      );

      let resMessage = "Users fetched successfully";
      if (users.users.length === 0) {
        resMessage = "No users found";
      }

      return sendSuccessResponse(res, [resMessage], {
        users: users.users,
        pagination: users.pagination,
      });
    } catch (error: any) {
      console.error("Error fetching users:", error.message);
      return sendErrorResponse(res, ["Failed to fetch users"], 500, error.message);
    }
  }


  static async DeleteMember(req: Request, res: Response) {
    try {
      const memberId = req.params.id;
      const adminRoleType = req.roleType;

      // 🔹 Check authorization
      if (adminRoleType !== 1) {
        return sendErrorResponse(
          res,
          ["You are not authorized to delete member details"],
          403
        );
      }

      // 🔹 Validate memberId
      if (!memberId) {
        return sendErrorResponse(res, ["Member ID is required"], 400);
      }

      // 🔹 Call service
      const isDeleted = await AdminAuthService.deleteMember(memberId);

      if (isDeleted) {
        return sendSuccessResponse(
          res,
          ["Member deleted successfully"],
          {},
          200
        );
      }

      // Fallback (should not normally reach here)
      return sendErrorResponse(res, ["Failed to delete member"], 400);

    } catch (error: any) {
      if (error.message.includes("Member not found or already deleted")) {
        return sendErrorResponse(res, ["Member not found or already deleted"], 404);
      }

      console.error("DeleteMember Error:", error.message);
      return sendErrorResponse(res, ["Internal Server Error"], 500, error.message);
    }
  }
}
