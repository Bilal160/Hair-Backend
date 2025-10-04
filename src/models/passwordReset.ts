import mongoose, { Schema } from "mongoose";
import IPasswordReset from "../interfaces/passwordResetInterface";

const passwordReset: Schema = new Schema(
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

export const PasswordReset = mongoose.model<IPasswordReset>(
  "PasswordReset",
  passwordReset
);
