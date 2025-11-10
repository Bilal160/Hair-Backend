import mongoose, { Schema } from "mongoose";
import { IBusinessProfile } from "../interfaces/businessProfileInterface";
import paginate from "mongoose-paginate-v2";

export const BusinessProfileSchema: Schema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: true,
      default: "",
    },
    businessDescription: {
      type: String,
      required: false,
      default: "",
    },
    businessLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        default: [0, 0],
      },
      state: {
        type: String,
        default: "canada",
        required: false,
      },
      city: {
        type: String,
        default: "",
        required: true,
      },
      postalCode: {
        type: String,
        default: "",
        required: false,
      },
      streetAddress: {
        type: String,
        default: "",
        required: true,
      },
    },
    phone: {
      type: String,
      required: true,
      default: "",
    },
    operatingHours: {
      type: String,
      required: false,
      default: "",
    },
    operatingDays: {
      type: String,
      required: false,
      default: "",
    },
    subscriptionType: {
      type: String,
      required: false,
      default: "free",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    averageRating: {
      type: Number,
      required: false,
      default: 0,
    },
    totalReviews: {
      type: Number,
      required: false,
      default: 0,
    },
    reviews: {
      type: [mongoose.Schema.Types.Mixed], // Use Mixed for IReview[]
      required: false,
      default: [],
    },
    isApproved: {
      type: Boolean,
      required: false,
      default: false,
    },
    featuredImageId: {
      type: mongoose.Types.ObjectId,
      required: false,
      ref: "ImagesUpload",
      default: null,
    },
    businessPhotosIds: {
      type: [mongoose.Types.ObjectId],
      ref: "ImagesUpload",
      required: false,
      default: [],
    },
    businessNICPhotoIds: {
      type: [mongoose.Types.ObjectId],
      required: false,
      ref: "ImagesUpload",
      default: [],
    },
    businessRegistrationDocId: {
      type: mongoose.Types.ObjectId,
      required: false,
      ref: "ImagesUpload",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

BusinessProfileSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

BusinessProfileSchema.virtual("businessReviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "businessId",
  justOne: false,
});

BusinessProfileSchema.virtual("featuredImage", {
  ref: "imagesUploads",
  localField: "featuredImageId",
  foreignField: "_id",
  justOne: true,
});

BusinessProfileSchema.virtual("businessPhotos", {
  ref: "imagesUploads",
  localField: "businessPhotosIds",
  foreignField: "_id",
  justOne: false,
});
BusinessProfileSchema.virtual("businessNICPhoto", {
  ref: "imagesUploads",
  localField: "businessNICPhotoIds",
  foreignField: "_id",
  justOne: false,
});

BusinessProfileSchema.virtual("businessRegistrationDoc", {
  ref: "imagesUploads",
  localField: "businessRegistrationDocId",
  foreignField: "_id",
  justOne: true,
});

// Create geospatial index for location-based queries
BusinessProfileSchema.index({ businessLocation: "2dsphere" });

BusinessProfileSchema.plugin(paginate);

export const BusinessProfile = mongoose.model<
  IBusinessProfile,
  mongoose.PaginateModel<IBusinessProfile>
>("BusinessProfile", BusinessProfileSchema, "businessprofiles");
