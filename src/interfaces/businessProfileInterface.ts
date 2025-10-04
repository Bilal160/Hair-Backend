import mongoose, { Document } from "mongoose";
import { IReview } from "./reviewInterface";

export interface IInstagramInfo {
  instagramToken?: string;
  tokenExpiry?: Date | null;
}
export interface IBusinessProfile extends Document {
  businessName: string;
  businessDescription: string;
  businessLocation: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
    state?: string;
    city: string;
    postalCode: string;
    streetAddress: string;
  };
  phone: string;

  operatingHours: string;

  subscriptionType: string;
  userId: mongoose.Types.ObjectId;
  averageRating?: number;
  totalReviews?: number;
  reviews?: IReview[];
  isApproved?: boolean;
  featuredImageId?: string;
  businessPhotosIds?: string[];
  businessNICPhotoId?: string[];
  businessRegistrationDocId?: string;




}
