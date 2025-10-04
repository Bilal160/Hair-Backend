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
  telegramLink: string;
  phone: string;
  instagramId: string;
  operatingHours: string;
  bannerImageId?: string;
  subscriptionType: string;
  websiteLink: string;
  googleBusinessLink: string;
  userId: mongoose.Types.ObjectId;
  averageRating?: number;
  totalReviews?: number;
  reviews?: IReview[];
  businessSlug?: string;
  slug?: string;
  dealIds: mongoose.Types.ObjectId[];
  lunchSpecialTime?: string;
  dailySpecialTime?: string;
  logoImageId?: string;
  instagramToken?: string;
  instagramInfo?: IInstagramInfo;
}
