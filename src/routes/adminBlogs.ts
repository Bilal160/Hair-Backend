import * as express from "express";
import { AdminBlogController } from "../controllers/blog/adminBlogController";
import { adminAuthMiddleware } from "../middlewares/adminAuthMiddleware";
import { uploadPhotoMiddleware } from "../middlewares/uploadPhotoMiddleware";

const router = express.Router();

//admin auth middleware
router.use(adminAuthMiddleware);

router.post(
  "/",
  adminAuthMiddleware,
  AdminBlogController.createBlog
);

router.get("/list", AdminBlogController.getAllBlogs);

router.get("/stats", AdminBlogController.getBlogStats);

router.get("/:blogId", AdminBlogController.getBlogById);

router.get("/slug/:slug", AdminBlogController.getBlogBySlug);

router.get("/blog-slug/:blogSlug", AdminBlogController.getBlogByBlogSlug);

router.put(
  "/:blogId",
  uploadPhotoMiddleware,
  AdminBlogController.updateBlog
);

router.delete("/:blogId", AdminBlogController.deleteBlog);


export default router;
