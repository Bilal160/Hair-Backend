import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "../interfaces/userInterface";
import paginate from "mongoose-paginate-v2";

const user: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    roleType: {
      type: Number,
      required: false,
      default: 0, // Default role type can be set to 0 (e.g., user)
    },
    isVerified: {
      type: Boolean,
      required: false,
      default: false,
    },
    profilePhotoId: {
      type: mongoose.Types.ObjectId,
      ref: "ProfilePhoto",
      required: false,
      default: null,
    },
    stripeCustomerId: {
      type: String,
      required: false,
      default: null,
    },
    stripeAccountId: {
      type: String,
      required: false,
      default: null,
    },

    stripeOnboardingUrl: {
      type: String,
      required: false,
      default: null,
    },
    stripeAccountVerified: {
      type: Boolean,
      required: false,
      default: false,
    },
    stripePayoutEnabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    stripeDetailEnabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    stripeChargesEnabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    stripeConnectedAccountUrl:
    {
      type: String,
      required: false,
      default: null,
    },

  },
  {
    timestamps: true, // Automatically creates `createdAt` and `updatedAt`
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

user.set("toJSON", { virtuals: true });
user.set("toObject", { virtuals: true });



user.virtual("profilePhoto", {
  ref: "imagesUploads",
  localField: "profilePhotoId",
  foreignField: "_id",
  justOne: true,
});

// Export the User model
//export const User = mongoose.model<IUser>('User', user);
user.plugin(paginate);
export const User = mongoose.model<IUser, mongoose.PaginateModel<IUser>>(
  "User",
  user,
  "users"
);
