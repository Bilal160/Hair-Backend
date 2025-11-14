import { Request, Response } from "express";
import { BlogService } from "../../services/blog/blogService";
import { blogQuerySchema } from "../../validations/blogValidation";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../utils/responseUtils";
import { handleValidationErrors } from "../../utils/helperUtils";

export class UserBlogController {
  static async getAllBlogs(req: Request, res: Response) {
    try {
      const { page, limit, search, sortBy, sortOrder } = req.query;

      // Validate query parameters
      const result = blogQuerySchema.safeParse({
        page,
        limit,
        search,
        sortBy,
        sortOrder,
      });

      if (!result.success) {
        const errorMessage = handleValidationErrors(result.error);
        sendErrorResponse(
          res,
          [`Validation Error: ${errorMessage}`],
          400
        );
        return;
      }

      const blogs = await BlogService.getAllBlogs(
        result.data.page,
        result.data.limit,
        result.data.search,
        result.data.sortBy,
        result.data.sortOrder
      );

      sendSuccessResponse(
        res,
        ["Blogs fetched successfully"],
        blogs
      );
    } catch (error: any) {
      sendErrorResponse(
        res,
        ["Failed to fetch blogs"],
        500,
        error.message
      );
    }
  }

  static async getBlogBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;

      if (!slug || slug === "undefined" || slug.length === 0) {
        sendErrorResponse(res, ["Slug is required"], 400);
        return;
      }

      const blog = await BlogService.getBlogBySlug(slug);

      if (!blog) {
        sendErrorResponse(res, ["Blog not found"], 404);
        return;
      }

      sendSuccessResponse(res, ["Blog fetched successfully"], { blog });
    } catch (error: any) {
      sendErrorResponse(
        res,
        ["Failed to fetch blog"],
        500,
        error.message
      );
    }
  }

  static async getBlogByBlogSlug(req: Request, res: Response) {
    try {
      const { blogSlug } = req.params;

      if (!blogSlug || blogSlug === "undefined" || blogSlug.length === 0) {
        sendErrorResponse(res, ["Blog slug is required"], 400);
        return;
      }

      const blog = await BlogService.getBlogByBlogSlug(blogSlug);

      if (!blog) {
        sendErrorResponse(res, ["Blog not found"], 404);
        return;
      }

      sendSuccessResponse(res, ["Blog fetched successfully"], { blog });
    } catch (error: any) {
      sendErrorResponse(
        res,
        ["Failed to fetch blog"],
        500,
        error.message
      );
    }
  }
}
