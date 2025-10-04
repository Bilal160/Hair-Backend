import mongoose, { Document, Schema } from 'mongoose';

// Define the IDocument interface
export interface IProfilePhoto extends Document {
    fileName: string;                       // Original file name
    fileType: string;                       // MIME type (e.g., "image/jpeg", "image/png")
    fileExtension: string;                  // File extension (e.g., "jpg", "png")
    fileSize: number;                       // File size in bytes
    url: string;      
    key:string;                      // URL where the photo is stored (could be a CDN or cloud storage link)
    uploadDate: Date;
}