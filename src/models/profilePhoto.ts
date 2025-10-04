import mongoose, { Schema } from "mongoose";
import { IProfilePhoto } from "../interfaces/profilePhotoInterface";

// Define the Document schema
const imagesUpload: Schema = new Schema({
    fileName: { type: String, required: true },                     // Original file name
    fileType: { type: String, required: true },                     // MIME type, e.g., "image/jpeg"
    fileExtension: { type: String, required: true },                // File extension, e.g., "jpg"
    fileSize: { type: Number, required: true },                     // File size in bytes
    url: { type: String, required: true },                          // URL for accessing the photo
    uploadDate: { type: Date, default: Date.now },
    key: { type: String, required: true },                          // S3 object key
},
    {
        timestamps: true
    });

// Create the Document model
export const ImagesUpload = mongoose.model<IProfilePhoto>('imagesUploads', imagesUpload);
