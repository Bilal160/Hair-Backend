import { Request, Response } from "express";
import { ContactUsService } from "../../services/contactUs/contactUs";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../utils/responseUtils";
import { contactUsSchema } from "../../validations/contactUsSchema";
import { IContactUs } from "../../validations/contactUsSchema";
import { generateToken, handleValidationErrors } from "../../utils/helperUtils";
export class ContactUsController {
  static async create(req: Request, res: Response) {
    try {
      const resultData = await contactUsSchema.safeParse(req.body);
      if (!resultData.success) {
        const errorMessage = handleValidationErrors(resultData.error);
        return sendErrorResponse(
          res,
          [`Validation Error: ${errorMessage}`],
          400
        );
      }

      // console.log(resultData.data.recaptchaToken, "resultData.data");
      // const recaptchaResult = await ContactUsService.verifyRecaptcha(
      //   resultData.data.recaptchaToken
      // );

      // console.log(recaptchaResult, "recaptchaResult");
      // if (!recaptchaResult) {
      //   return sendErrorResponse(res, ["Invalid recaptcha token."], 400);
      // }

      const result = await ContactUsService.createContactUsService(
        resultData.data
      );
      if (result) {
        return sendSuccessResponse(
          res,
          ["Message sent to admin."],
          result,
          200
        );
      } else {
        return sendErrorResponse(res, ["Failed to send message."], 400);
      }
    } catch (error) {
      console.error("Error sending contact message:", error);
      return sendErrorResponse(res, ["Failed to send message."], 500);
    }
  }
}
