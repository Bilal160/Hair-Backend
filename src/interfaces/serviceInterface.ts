import mongoose, { Document } from "mongoose";
export interface IService extends Document {
  userId: mongoose.Types.ObjectId | string;
  businessId: mongoose.Types.ObjectId | string;
  name: string;
  description: string;
  servicePhotoId: mongoose.Types.ObjectId | string;
}
