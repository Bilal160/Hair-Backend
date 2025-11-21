import { Blog } from "../../models/blog";
import { IBlog } from "../../interfaces/blogInterface";
import { deleteFile, handlePhotoUpload } from "../../utils/imagesUtils";

export class BlogService {
  // static async createBlog(data: IBlog & { featuredImage?: Express.Multer.File }) {
  //   try {


  //     // If image added then image upload


  //     // Generate blogSlug from slug
  //     const blogSlug = await this.generateBlogSlug(data.slug);

  //     const blogData = {
  //       ...data,
  //       blogSlug,
  //     };

  //     // Remove the file from data before saving
  //     delete blogData.featuredImage;

  //     return await Blog.create(blogData);
  //   } catch (error: any) {
  //     console.error("Error creating blog:", error.message);
  //     throw new Error("Failed to create blog");
  //   }
  // }

  static async createBlog(data: IBlog) {
    try {
      const blog = await Blog.create(data);
      return blog;
    } catch (err: any) {
      console.error("Create Blog Error:", err);
      throw new Error("Failed to create blog");
    }
  }

  static async updateBlog(id: string, data: Partial<IBlog>) {
    const updatedBlog = await Blog.findByIdAndUpdate(id, data, {
      new: true,
    })
      .select("-__v")
      .populate("featuredImage", "url _id");

    return updatedBlog;
  }


  static async getAllBlogs(
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy: string = "createdAt",
    sortOrder: "asc" | "desc" = "desc"
  ) {
    try {
      const query: any = {};

      // Search functionality
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } },
        ];
      }

      const options: any = {
        page,
        limit,
        sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
        populate: [
          {
            path: "featuredImage",
            select: "url _id",
          },
        ],
      };

      const blogs = await Blog.paginate(query, options);

      return {
        blogs: blogs.docs,
        pagination: {
          page: blogs.page,
          totalPages: blogs.totalPages,
          totalDocs: blogs.totalDocs,
          limit: blogs.limit,
        },
      };
    } catch (error: any) {
      console.error("Error fetching blogs:", error.message);
      throw new Error("Failed to fetch blogs");
    }
  }

  static async getBlogById(id: string) {
    try {
      return await Blog.findById(id)
        .populate({
          path: "featuredImage",
          select: "url _id",
        });
    } catch (error: any) {
      console.error("Error fetching blog by ID:", error.message);
      throw new Error("Failed to fetch blog by ID");
    }
  }

  static async getBlogBySlug(slug: string) {
    try {
      const blog = await Blog.findOne({ slug })
        .populate({
          path: "featuredImage",
          select: "url _id",
        });

      return blog;
    } catch (error: any) {
      console.error("Error fetching blog by slug:", error.message);
      throw new Error("Failed to fetch blog by slug");
    }
  }

  static async getBlogByBlogSlug(blogSlug: string) {
    try {
      const blog = await Blog.findOne({ blogSlug })
        .populate({
          path: "featuredImage",
          select: "url _id",
        });

      return blog;
    } catch (error: any) {
      console.error("Error fetching blog by blog slug:", error.message);
      throw new Error("Failed to fetch blog by blog slug");
    }
  }

  // static async updateBlog(
  //   id: string,
  //   data: Partial<IBlog>
  // ) {
  //   const existingBlog = await Blog.findById(id);
  //   if (!existingBlog) throw new Error("Blog not found");

  //   const updatedBlog = await Blog.findByIdAndUpdate(
  //     id,
  //     {
  //       ...data, // contains title, content, featuredImageId, slug, etc.
  //     },
  //     { new: true }
  //   )
  //     .select("-__v")
  //     .populate({
  //       path: "featuredImage",
  //       select: "url _id",
  //     });

  //   return updatedBlog;
  // }


  static async deleteBlog(id: string) {
    try {
      const existingBlog = await Blog.findById(id);
      if (!existingBlog) {
        throw new Error("Blog not found");
      }

      // Delete featured image if exists and is valid
      if (existingBlog.featuredImageId && existingBlog.featuredImageId.toString().trim() !== '') {
        try {
          await deleteFile(existingBlog.featuredImageId.toString());
        } catch (imageError) {
          console.warn("Failed to delete featured image:", imageError);
          // Continue with blog deletion even if image deletion fails
        }
      }

      return await Blog.findByIdAndDelete(id);
    } catch (error: any) {
      console.error("Error deleting blog:", error.message);
      throw new Error("Failed to delete blog");
    }
  }

  static async getBlogStats() {
    try {
      const totalBlogs = await Blog.countDocuments();

      return {
        totalBlogs,
      };
    } catch (error: any) {
      console.error("Error fetching blog stats:", error.message);
      throw new Error("Failed to fetch blog stats");
    }
  }

  static async generateSlug(title: string, excludeId?: string): Promise<string> {
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existingBlog = await Blog.findOne({
        slug,
        ...(excludeId && { _id: { $ne: excludeId } })
      });

      if (!existingBlog) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  static async generateBlogSlug(slug: string): Promise<string> {
    const frontendUrl = process.env.FRONTEND_URL?.trim().replace(/\/+$/, "") || "";
    return `${frontendUrl}/blog/${slug}`;
  }



  static async formattedBlogData(req: any) {
    const body = req?.body || {};

    console.log(body, "comming body")
    const files = req.files || {};

    const cleaned: Record<string, any> = {};

    // clean string values
    for (let [key, value] of Object.entries(body)) {
      key = key.trim();
      if (typeof value === "string") cleaned[key] = value.trim();
      else cleaned[key] = value;
    }

    // convert to boolean
    cleaned.removeFeaturedImage = cleaned.removeFeaturedImage === "true";

    // final response
    return {
      ...cleaned,
      featuredImage: files?.featuredImage?.[0] || null,
    };
  }


}
