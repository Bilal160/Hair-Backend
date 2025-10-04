import { Document } from "mongoose";

export default interface IPasswordReset extends Document {
  email: string;
  verificationCode: string;
  expireAt: Date;
}
