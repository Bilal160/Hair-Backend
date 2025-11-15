import * as express from "express";
import { UserBlogController } from "../controllers/blog/userBlogController";
import { userAuthMiddleware } from "../middlewares/userAuthMiddleware";

const router = express.Router();
// router.use(userAuthMiddleware);

// Get all blogs (public access)
router.get("/", UserBlogController.getAllBlogs);

// Get blog by slug (public access)
router.get("/slug/:slug", UserBlogController.getBlogBySlug);

// Get blog by blog slug (public access)
router.get("/blog-slug/:blogSlug", UserBlogController.getBlogByBlogSlug);

export default router;
