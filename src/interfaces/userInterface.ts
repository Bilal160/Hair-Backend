import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email?: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  roleType?: number;
  profilePhotoId?: mongoose.Types.ObjectId | null;

  isVerified?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser; // Attach Passport's user property to the Request object
    }
  }
}
