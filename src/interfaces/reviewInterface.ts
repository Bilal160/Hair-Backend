import mongoose, { Document } from "mongoose";
export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  rating: string;
  comment: string;
  createdAt?: Date;
}
