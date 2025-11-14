import mongoose, { Schema } from "mongoose";
import { IBlog } from "../interfaces/blogInterface";
import paginate from "mongoose-paginate-v2";

export const BlogSchema: Schema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,

    },
    description: {
      type: String,
      required: true,
      trim: true,

    },
    content: {
      type: String,
      required: true,
    },
    featuredImageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "imagesUploads",
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    blogSlug: {
      type: String,
      required: false,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for featured image
BlogSchema.virtual("featuredImage", {
  ref: "imagesUploads",
  localField: "featuredImageId",
  foreignField: "_id",
  justOne: true,
});
BlogSchema.index({ slug: 1 });
BlogSchema.index({ createdAt: -1 });

// Pre-save middleware to generate slug from title
BlogSchema.pre<IBlog>("save", function (next) {
  if (this.isModified("title") && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  next();
});


BlogSchema.plugin(paginate);

export const Blog = mongoose.model<IBlog, mongoose.PaginateModel<IBlog>>(
  "Blog",
  BlogSchema,
  "blogs"
);
