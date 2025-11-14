import mongoose, { Document } from "mongoose";

export interface IBlog extends Document {
  title: string;
  description: string;
  content: string;
  featuredImageId?: string;
  featuredImage?: {
    _id: string;
    url: string;
  };
  slug: string;
  blogSlug?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
