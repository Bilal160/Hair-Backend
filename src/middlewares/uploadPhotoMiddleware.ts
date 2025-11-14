import { Request, Response, NextFunction } from "express";
import multer from "multer";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { sendErrorResponse } from "../utils/responseUtils";
import { convertHEIFBufferToJPEG } from "../utils/imagesUtils";

dotenv.config();

// Memory storage for multer
const storage = multer.memoryStorage();
const maxSize = 1 * 1024 * 1024 * 1024; // 1GB

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/heic"
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Unsupported file type. Only JPEG, JPG, PNG, and HEIC formats are allowed."
      )
    );
  }
};

const upload = multer({
  storage,
  limits: { fileSize: maxSize },
  fileFilter,
}).fields([
  { name: "logoPhoto", maxCount: 1 },
  { name: "bannerPhoto", maxCount: 1 },
  { name: "categoryPhoto", maxCount: 1 },
  { name: "dealPhoto", maxCount: 2 },
  { name: "profilePhoto", maxCount: 1 },
  { name: "businessPhotos", maxCount: 4 },
  { name: "businessNICPhoto", maxCount: 2 },
  { name: "businessRegistrationDoc", maxCount: 1 },
  { name: "businessFeaturedImage", maxCount: 1 },
  { name: "servicePhoto", maxCount: 1 },
  { name: "featuredImage", maxCount: 1 }

]);

// ✅ Custom error messages for each field
const maxCountErrors: Record<string, string> = {
  logoPhoto: "You can only upload 1 logo photo",
  bannerPhoto: "You can only upload 1 banner photo",
  categoryPhoto: "You can only upload 1 category photo",
  dealPhoto: "You can only upload 2 deal photos",
  profilePhoto: "You can only upload 1 profile photo",
  businessPhotos: "You can only upload 4 business photos",
  businessNICPhoto: "You can only upload 2 business NIC photos",
  businessRegistrationDoc:
    "You can only upload 1 business registration document",
  businessFeaturedImage: "You can only upload 1 business featured image",
  servicePhoto: "You can only upload 1 Service Image",
  featuredImage: "You can only upload 1 category photo",
};

export const uploadPhotoMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  upload(req, res, async (err: any) => {
    if (err) {
      // ✅ Handle maxCount exceeded (LIMIT_UNEXPECTED_FILE)
      if (err.code === "LIMIT_UNEXPECTED_FILE" && err.field) {
        const message =
          maxCountErrors[err.field] || `Too many files for ${err.field}`;
        return sendErrorResponse(res, [message], 400);
      }

      // ✅ Other multer errors (fileSize, etc.)
      return sendErrorResponse(res, [err.message], 400);
    }

    try {
      const fileFields = [
        "logoPhoto",
        "bannerPhoto",
        "categoryPhoto",
        "dealPhoto",
        "profilePhoto",
        "businessPhotos",
        "businessNICPhoto",
        "businessRegistrationDoc",
        "businessFeaturedImage",
        "servicePhoto",
        "featuredImage"
      ];

      for (const field of fileFields) {
        const files = (
          req.files as { [fieldname: string]: Express.Multer.File[] }
        )?.[field];

        if (files?.length) {
          for (let file of files) {
            const isHEIC =
              file.mimetype === "image/heic" ||
              /\.(heic|heif)$/i.test(file.originalname);

            if (isHEIC) {
              const jpegBuffer = await convertHEIFBufferToJPEG(file.buffer);

              file.buffer = jpegBuffer;
              file.originalname = file.originalname.replace(
                /\.(heic|heif)$/i,
                ".jpeg"
              );
              file.mimetype = "image/jpeg";
            }
          }
        }
      }

      next();
    } catch (conversionErr: any) {
      console.error("HEIC conversion error:", conversionErr);
      return sendErrorResponse(
        res,
        [conversionErr.message || "Image conversion failed"],
        500
      );
    }
  });
};

export const deleteLogoFile = async (fileName: string) => {
  try {
    const filePath = path.join(process.cwd(), "/public/uploadLogos", fileName);
    fs.unlinkSync(filePath);
    console.log("Logo file deleted:", fileName);
  } catch (error) {
    console.error("Error deleting logo file:", error);
  }
};
