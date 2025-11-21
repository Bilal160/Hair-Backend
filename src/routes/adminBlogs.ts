import * as express from "express";
import { AdminBlogController } from "../controllers/blog/adminBlogController";
import { adminAuthMiddleware } from "../middlewares/adminAuthMiddleware";
import { uploadPhotoMiddleware } from "../middlewares/uploadPhotoMiddleware";
import { asyncHandler } from "../utils/helperUtils";

const router = express.Router();

//admin auth middleware
router.use(adminAuthMiddleware);

router.post(
  "/",
  adminAuthMiddleware,
  asyncHandler(AdminBlogController.createBlog)
);

router.get("/list", asyncHandler(AdminBlogController.getAllBlogs));

// router.get("/stats", AdminBlogController.getBlogStats);

router.get("/:blogId", asyncHandler(AdminBlogController.getBlogById));

router.get("/slug/:slug", asyncHandler(AdminBlogController.getBlogBySlug));

router.get("/blog-slug/:blogSlug", asyncHandler(AdminBlogController.getBlogByBlogSlug));

router.put(
  "/:blogId",
  uploadPhotoMiddleware,
  asyncHandler(AdminBlogController.updateBlog)
);

router.delete("/:blogId", asyncHandler(AdminBlogController.deleteBlog));


export default router;
