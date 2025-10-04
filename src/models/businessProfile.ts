import mongoose, { Schema } from "mongoose";
import { IBusinessProfile } from "../interfaces/businessProfileInterface";
import paginate from "mongoose-paginate-v2";

export const BusinessProfileSchema: Schema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: false,
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
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
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
      },
      postalCode: {
        type: String,
        default: "",
      },
      streetAddress: {
        type: String,
        default: "",
      },
    },
    telegramLink: {
      type: String,
      required: false,
      default: "",
    },
    phone: {
      type: String,
      required: false,
      default: "",
    },

    instagramId: {
      type: String,
      required: false,
      default: "",
    },
    operatingHours: {
      type: String,
      required: false,
      default: "",
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      default: null,
    },
    averageRating: {
      type: Array,
      required: false,
      default: [],
    },
    totalReviews: {
      type: Number,
      required: false,
      default: 0,
    },
    reviews: {
      type: Array,
      required: false,
      default: [],
    },

    businessSlug: {
      type: String,
      required: false,
      default: "",
    },
    slug: {
      type: String,
      required: false,
      default: "",
    },
    dealIds: {
      type: Array,
      required: false,
      ref: "Deal",
      default: [],
    },

    bannerImageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "imagesUpload",
      required: false,
      default: null,
    },

    subscriptionType: {
      type: String,
      required: false,
      default: "free",
    },
    websiteLink: {
      type: String,
      required: false,
      default: "",
    },
    googleBusinessLink: {
      type: String,
      required: false,
      default: "",
    },
    lunchSpecialTime: {
      type: String,
      required: false,
      default: "",
    },
    dailySpecialTime: {
      type: String,
      required: false,
      default: "",
    },
    logoImageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "imagesUpload",
      required: false,
      default: null,
    },
    instagramToken: {
      type: String,
      required: false,
      default: "",
    },
  instagramInfo: {
  instagramToken: {
    type: String,
    default: "",
  },
  tokenExpiry: {
    type: Date, // Better than null/Number if you're storing expiry timestamp
    default: null,
  },
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

BusinessProfileSchema.virtual("bannerImage", {
  ref: "imagesUpload",
  localField: "bannerImageId",
  foreignField: "_id",
  justOne: true,
});

BusinessProfileSchema.virtual("logoImage", {
  ref: "imagesUpload",
  localField: "logoImageId",
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
