// src/Services/ContactUs/index.ts

import { sendMail } from "../../utils/emailUtils";
import { IContactUs } from "../../validations/contactUsSchema";
import { User } from "../../models/user";
import axios from "axios";
// if using Zod or an interface

export class ContactUsService {
  static async createContactUsService(data: IContactUs) {
    const adminEmail = await User.find({ roleType: 2 });

    if (!adminEmail.length || !adminEmail[0]?.email) {
      throw new Error("No admin email found");
    }

    console.log(adminEmail[0].email);
    await sendMail(4, adminEmail[0].email, undefined, data.name, {
      email: data.email,
      message: data.description,
    });

    return true;
  }

  static async verifyRecaptcha(token: string) {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    // Use your secret key here securely
    console.log(secretKey, "secretKey");
    try {
      const response = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify`,
        null,
        {
          params: {
            secret: secretKey,
            response: token,
          },
        }
      );

      const data = response.data;
      console.log(data, "data");

      return data.success && data.score >= 0.5; // for reCAPTCHA v3, adjust score as needed
      // return data.success; // for reCAPTCHA v2
    } catch (error) {
      console.error("reCAPTCHA verification failed:", error);
      return false;
    }
  }
}
