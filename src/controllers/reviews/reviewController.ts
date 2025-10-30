import { Request, Response } from "express";
import { IReview } from "../../interfaces/reviewInterface";
import { ReviewsService } from "../../services/review/reviewServices";
import { handleValidationErrors } from "../../utils/helperUtils";
import { sendErrorResponse, sendSuccessResponse } from "../../utils/responseUtils";
import { createReviewSchema, updateReviewSchema } from "../../validations/reviewValidation";

export class ReviewController {
  constructor(private readonly reviewService: ReviewsService) { }

  static async addReview(req: Request, res: Response) {
    const { businessId, rating, comment } = req.body;
    const userId = req.userId;

    const result = await createReviewSchema.safeParse(req.body);
    if (!result.success) {
      const errorMessage = handleValidationErrors(result.error);
      return sendErrorResponse(res, [errorMessage], 400);
    }
    try {
      const reviewData = {
        userId,
        businessId,
        rating,
        comment,
      };
      const review = await ReviewsService.createReview(reviewData as IReview);
      return sendSuccessResponse(res, ["Review created successfully"], {
        review: review,
      });
    } catch (error) {
      console.log(error);
      return sendErrorResponse(res, ["Error creating review"], 500);
    }
  }

  static async updateReview(req: Request, res: Response) {
    const { reviewId, businessId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.userId;

    const result = await updateReviewSchema.safeParse(req.body);
    if (!result.success) {
      const errorMessage = handleValidationErrors(result.error);
      return sendErrorResponse(res, [errorMessage], 400);
    }
    try {
      const reviewData = {
        rating,
        comment,
      };
      const review = await ReviewsService.updateReview({
        userId,
        id: reviewId,
        businessId,
        updateData: reviewData,
      });
      return sendSuccessResponse(res, ["Review updated successfully"], {
        review,
      });
    } catch (error: any) {
      console.log(error);

      if (error.message === "Review not found") {
        return sendErrorResponse(res, ["Review not found"], 404);
      }
      return sendErrorResponse(res, ["Error updating review"], 500);
    }
  }

  static async deleteReview(req: Request, res: Response) {
    const { reviewId, businessId } = req.params;
    const userId = req.userId;

    try {
      const review = await ReviewsService.deleteReview({
        userId,
        id: reviewId,
        businessId,
      });
      if (review === null) {
        return sendErrorResponse(res, ["Review not found"], 404);
      }

      return sendSuccessResponse(res, ["Review deleted successfully"], {});
    } catch (error) {
      console.log(error);

      return sendErrorResponse(res, ["Error deleting review"], 500);
    }
  }

  static async getReviewById(req: Request, res: Response) {
    const { reviewId, businessId } = req.params;
    const userId = req.userId;

    try {
      const review = await ReviewsService.getReviewById({
        id: reviewId,
        userId,
        businessId,
      });
      if (review === null) {
        return sendErrorResponse(res, ["Review not found"], 404);
      }
      return sendSuccessResponse(res, ["Review fetched successfully"], {
        review,
      });
    } catch (error) {
      console.log(error);
      return sendErrorResponse(res, ["Error fetching review"], 500);
    }
  }
}
