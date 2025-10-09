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
    description: {
      type: String,
      required: true,
    },
    servicePhotoId: {
      type: mongoose.Schema.Types.ObjectId,
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

ServiceSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

ServiceSchema.virtual("business", {
  ref: "businessProfile",
  localField: "businessId",
  foreignField: "_id",
  justOne: true,
});

ServiceSchema.virtual("featuredIma", {
  ref: "imagesUploads",
  localField: "featuredImageId",
  foreignField: "_id",
  justOne: true,
});

ServiceSchema.plugin(paginate);

export const Services = mongoose.model<
  IService,
  mongoose.PaginateModel<IService>
>("Service", ServiceSchema, "services");
