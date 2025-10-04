import Stripe from "stripe";
import { IReview } from "../../interfaces/reviewInterface";
import { Review } from "../../models/review";

export class ReviewsService {
  static async createReview(review: IReview) {
    try {
      const newReview = await Review.create(review);

      let finalData = {
        userId: newReview.userId,
        businessId: newReview.businessId,
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: newReview.createdAt,
        // _id excluded
        id: newReview._id,
      };

      return finalData;
    } catch (error) {
      throw error;
    }
  }

  static async updateReview({
    userId,
    id,
    businessId,
    updateData,
  }: {
    userId: string;
    id: string;
    businessId: string;
    updateData: any;
  }) {
    try {
      let review = await this.getReviewById({ id, userId, businessId });
      if (review === null) {
        throw new Error("Review not found");
      }
      const updatedReview = await Review.findByIdAndUpdate(id, updateData, {
        new: true,
      }).select("-__v  -updatedAt ");

      return updatedReview;
    } catch (error) {
      throw error;
    }
  }

  static async getReviewById({
    id,
    userId,
    businessId,
  }: {
    id: string;
    userId: string;
    businessId: string;
  }) {
    try {
      const review = await Review.findOne({
        _id: id,
        userId,
        businessId,
      })
        .select("-__v  -updatedAt ")
        .populate({
          path: "user",
          select: "name  ",
        });
      if (!review) {
        return null;
      }
      return review;
    } catch (error) {
      throw error;
    }
  }

  static async getReviews(businessId: string) {
    try {
      const reviews = await Review.find({ businessId })

        .select("rating comment userId createdAt _id   ")
        .sort({ createdAt: -1 })
        .populate({
          path: "user",
          select: "name  ",
        });

      const totalReviews = reviews.length;
      if (totalReviews === 0) {
        return { reviews, averageRating: 0, totalReviews: 0 };
      }

      const averageRating = (
        reviews.reduce((acc, review) => acc + Number(review.rating), 0) /
        totalReviews
      ).toFixed(1);
      return { reviews, averageRating, totalReviews };
    } catch (error) {
      throw error;
    }
  }

  static async deleteReview({
    userId,
    id,
    businessId,
  }: {
    userId: string;
    id: string;
    businessId: string;
  }) {
    try {
      const review = await this.getReviewById({ id, userId, businessId });
      if (review === null) {
        return null;
      }
      await Review.findByIdAndDelete(id);
      return true;
    } catch (error) {
      throw error;
    }
  }
}
