import mongoose, { Schema } from "mongoose";
import { IReview } from "../interfaces/reviewInterface";
import { IService } from "../interfaces/serviceInterface";
import paginate from "mongoose-paginate-v2";

export const ServiceSchema: Schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessProfile",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    servicePhotoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ImagesUpload",
      default: null,
    },

    isActive: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ServiceSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

ServiceSchema.virtual("business", {
  ref: "BusinessProfile",
  localField: "businessId",
  foreignField: "_id",
  justOne: true,
});

ServiceSchema.virtual("servicePhoto", {
  ref: "imagesUploads",
  localField: "servicePhotoId",
  foreignField: "_id",
  justOne: true,
});

ServiceSchema.plugin(paginate);

export const Service = mongoose.model<
  IService,
  mongoose.PaginateModel<IService>
>("Service", ServiceSchema, "services");
