import mongoose, { Schema } from "mongoose";
import IEmail from "../interfaces/emailVerificationInterface";

const emailVerification: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    verificationCode: {
      type: String || undefined,
      default: null,
    },
    expireAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    //toJSON: { virtuals: true },
    //toObject: { virtuals: true }
  }
);

export const EmailVerification = mongoose.model<IEmail>(
  "emeilVerificationsTokens",
    emailVerification
);
