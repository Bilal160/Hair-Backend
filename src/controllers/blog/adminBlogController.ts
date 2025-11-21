import { Request, Response } from "express";
import { BlogService } from "../../services/blog/blogService";
import {
  createBlogSchema,
  updateBlogSchema,
  blogQuerySchema,
} from "../../validations/blogValidation";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../utils/responseUtils";
import { handleValidationErrors } from "../../utils/helperUtils";
import { deleteFile, handlePhotoUpload } from "../../utils/imagesUtils";
import { IBlog } from "../../interfaces/blogInterface";

export class AdminBlogController {
  // static async createBlog(req: Request, res: Response) {
  //   try {
  //     const { title, description, content, featuredImageId } = req.body;

  //     // Validate input data
  //     const result = createBlogSchema.safeParse({
  //       title,
  //       description,
  //       content,
  //       featuredImageId,
  //     });

  //     if (!result.success) {
  //       const errorMessage = handleValidationErrors(result.error);
  //       sendErrorResponse(
  //         res,
  //         [`Validation Error: ${errorMessage}`],
  //         400
  //       );
  //       return;
  //     }

  //     // Generate unique slug from title
  //     const finalSlug = await BlogService.generateSlug(result.data.title);

  //     // Handle featured image upload
  //     let finalFeaturedImageId: string | null = null;
  //     if ((req.files as any)?.featuredImage?.[0]) {
  //       const uploadedId = await handlePhotoUpload(
  //         (req.files as any).featuredImage[0],
  //         "images"
  //       );
  //       if (Array.isArray(uploadedId) && uploadedId.length > 0) {
  //         finalFeaturedImageId = uploadedId[0];
  //       } else if (typeof uploadedId === "string") {
  //         finalFeaturedImageId = uploadedId;
  //       }
  //     } else if (result.data.featuredImageId) {
  //       finalFeaturedImageId = Array.isArray(result.data.featuredImageId)
  //         ? result.data.featuredImageId[0]
  //         : result.data.featuredImageId;
  //     }

  //     console.log(finalFeaturedImageId)

  //     const blogData = {
  //       ...result.data,
  //       slug: finalSlug,
  //       featuredImageId: finalFeaturedImageId,
  //     };

  //     const blog = await BlogService.createBlog(blogData as any);

  //     sendSuccessResponse(
  //       res,
  //       ["Blog created successfully"],
  //       { blog },
  //       201
  //     );
  //   } catch (error: any) {
  //     sendErrorResponse(
  //       res,
  //       ["Failed to create blog"],
  //       500,
  //       error.message
  //     );
  //   }
  // }
  static async createBlog(req: Request, res: Response) {
    try {
      // 1️⃣ Wait for formatted body
      const formatted = await BlogService.formattedBlogData(req);

      console.log(formatted, "formatted data")

      // 2️⃣ Validate using Zod
      const result = createBlogSchema.safeParse(formatted);
      if (!result.success) {
        const errorMessage = handleValidationErrors(result.error);
        return sendErrorResponse(res, [`Validation Error: ${errorMessage}`], 400);
      }

      const validated = result.data;

      // 3️⃣ Generate slug
      const finalSlug = await BlogService.generateSlug(validated.title);

      // 4️⃣ Handle Featured Image Upload
      let imageId: string | null = validated.featuredImageId || null;

      if (formatted.featuredImage) {
        const uploadedId = await handlePhotoUpload(formatted.featuredImage, "images");
        imageId = Array.isArray(uploadedId) ? uploadedId[0] : uploadedId;
      }

      // 5️⃣ Final blog data shape according to IBlog
      const blogData: Partial<IBlog> = {
        title: validated.title,
        description: validated.description,
        content: validated.content,
        slug: finalSlug,
        featuredImageId: imageId ?? undefined, // Ensure type is string | undefined for IBlog

      };

      // 6️⃣ Create blog
      const blog = await BlogService.createBlog(blogData as IBlog);

      return sendSuccessResponse(res, ["Blog created successfully"], { blog }, 201);
    } catch (error: any) {
      console.error("Create Blog Error:", error);
      return sendErrorResponse(res, [error.message], 500);
    }
  }


  static async updateBlog(req: Request, res: Response) {
    try {
      const blogId = req.params.blogId;
      if (!blogId) return sendErrorResponse(res, ["Blog ID is required"], 400);

      // 1️⃣ Wait for formatted body
      const formatted = await BlogService.formattedBlogData(req);

      // 2️⃣ Validate using Zod (same schema or separate update schema)
      const result = updateBlogSchema.safeParse(formatted);
      if (!result.success) {
        const errorMessage = handleValidationErrors(result.error);
        return sendErrorResponse(res, [`Validation Error: ${errorMessage}`], 400);
      }

      const validated = result.data;

      // 3️⃣ If title is changed, generate new slug
      let finalSlug: string | undefined;
      if (typeof validated.title === "string") {
        finalSlug = await BlogService.generateSlug(validated.title);
      } else {
        // fallback to existing slug if no title change
        finalSlug = (validated as any).slug;
      }


      // 4️⃣ Handle Featured Image update
      let imageId: string | null = validated.featuredImageId || null;

      // If user removed image manually
      if (validated.removeFeaturedImage) {
        imageId = null;
      }

      // If new file uploaded
      if (formatted.featuredImage) {
        const uploadedId = await handlePhotoUpload(formatted.featuredImage, "images");
        imageId = Array.isArray(uploadedId) ? uploadedId[0] : uploadedId;
      }

      // 5️⃣ Final payload for update according to IBlog
      const updateData: Partial<IBlog> = {
        ...validated,
        slug: finalSlug,
        featuredImageId: imageId ?? undefined,
      };

      // 6️⃣ Update in DB
      const updatedBlog = await BlogService.updateBlog(blogId, updateData);

      if (!updatedBlog) {
        return sendErrorResponse(res, ["Blog not found"], 404);
      }

      return sendSuccessResponse(res, ["Blog updated successfully"], { updatedBlog }, 200);
    } catch (error: any) {
      console.error("Update Blog Error:", error);
      return sendErrorResponse(res, [error.message], 500);
    }
  }



  static async getAllBlogs(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      // Validate query parameters
      const queryResult = blogQuerySchema.safeParse({
        page,
        limit,
        search,
        sortBy,
        sortOrder,
      });

      if (!queryResult.success) {
        const errorMessage = handleValidationErrors(queryResult.error);
        sendErrorResponse(
          res,
          [`Validation Error: ${errorMessage}`],
          400
        );
        return;
      }

      const blogs = await BlogService.getAllBlogs(
        queryResult.data.page,
        queryResult.data.limit,
        queryResult.data.search,
        queryResult.data.sortBy,
        queryResult.data.sortOrder
      );

      let resMessage = "Blogs fetched successfully";
      if (blogs.blogs.length === 0) {
        resMessage = "No blogs found";
      }

      sendSuccessResponse(res, [resMessage], {
        blogs: blogs.blogs,
        pagination: blogs.pagination,
      });
    } catch (error: any) {
      sendErrorResponse(
        res,
        ["Failed to fetch blogs"],
        500,
        error.message
      );
    }
  }

  static async getBlogById(req: Request, res: Response) {
    try {
      const blog = await BlogService.getBlogById(req.params.blogId);

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

  static async getBlogBySlug(req: Request, res: Response) {
    try {
      const blog = await BlogService.getBlogBySlug(req.params.slug);

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
      const blog = await BlogService.getBlogByBlogSlug(req.params.blogSlug);

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

  // static async updateBlog(req: Request, res: Response) {
  //   try {
  //     const { blogId } = req.params;
  //     const { title, description, content } = req.body;

  //     // 1️⃣ Validate input
  //     const result = updateBlogSchema.safeParse({ title, description, content });
  //     if (!result.success) {
  //       const errorMessage = handleValidationErrors(result.error);
  //       return sendErrorResponse(res, [`Validation Error: ${errorMessage}`], 400);
  //     }

  //     // 2️⃣ Get existing blog
  //     const existingBlog = await BlogService.getBlogById(blogId);
  //     if (!existingBlog) {
  //       return sendErrorResponse(res, ["Blog not found"], 404);
  //     }

  //     // 3️⃣ Generate new slug if title changed
  //     let finalSlug = existingBlog.slug;
  //     if (result.data.title && result.data.title !== existingBlog.title) {
  //       finalSlug = await BlogService.generateSlug(result.data.title, blogId);
  //     }

  //     // 4️⃣ Handle featured image upload
  //     const featuredFile = (req.files as any)?.featuredImage?.[0];
  //     let featuredImageId = existingBlog.featuredImageId;

  //     if (featuredFile) {
  //       // Delete old image if exists
  //       if (existingBlog.featuredImageId) {
  //         try {
  //           await deleteFile(existingBlog.featuredImageId.toString());
  //           console.log("Old featured image deleted");
  //         } catch (err) {
  //           console.warn("Failed to delete old featured image:", err);
  //         }
  //       }

  //       // Upload new image
  //       const uploadedId = await handlePhotoUpload(featuredFile, "images");
  //       featuredImageId = Array.isArray(uploadedId) ? uploadedId[0] : uploadedId ?? undefined;
  //     }

  //     // 5️⃣ Prepare update data
  //     const updateData = {
  //       ...result.data,
  //       slug: finalSlug,
  //       featuredImageId, // updated or existing
  //     };

  //     // 6️⃣ Update blog
  //     const updatedBlog = await BlogService.updateBlog(blogId, updateData as any);

  //     return sendSuccessResponse(res, ["Blog updated successfully"], {
  //       blog: updatedBlog,
  //     });
  //   } catch (error: any) {
  //     console.error("Update blog error:", error);
  //     return sendErrorResponse(res, ["Failed to update blog"], 500, error.message);
  //   }
  // }

  static async deleteBlog(req: Request, res: Response) {
    try {
      const { blogId } = req.params;

      const existingBlog = await BlogService.getBlogById(blogId);
      if (!existingBlog) {
        sendErrorResponse(res, ["Blog not found"], 404);
        return;
      }

      const deleted = await BlogService.deleteBlog(blogId);

      if (!deleted) {
        sendErrorResponse(res, ["Failed to delete blog"], 500);
        return;
      }

      sendSuccessResponse(res, ["Blog deleted successfully"], {});
    } catch (error: any) {
      sendErrorResponse(
        res,
        ["Failed to delete blog"],
        500,
        error.message
      );
    }
  }


  static async getBlogStats(req: Request, res: Response) {
    try {
      const stats = await BlogService.getBlogStats();

      sendSuccessResponse(res, ["Blog stats fetched successfully"], {
        stats,
      });
    } catch (error: any) {
      sendErrorResponse(
        res,
        ["Failed to fetch blog stats"],
        500,
        error.message
      );
    }
  }
}
