import fs from "fs";
import path from "path";
import heicConvert from "heic-convert";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ObjectCannedACL,
} from "@aws-sdk/client-s3";
import { ImagesUpload } from "../models/profilePhoto";
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

console.log("S3 Client", s3Client.config);



export const convertHEIFBufferToJPEG = async (
  inputBuffer: Buffer
): Promise<Buffer> => {
  try {
    const outputBuffer = await heicConvert({
      buffer: inputBuffer.buffer.slice(inputBuffer.byteOffset, inputBuffer.byteOffset + inputBuffer.byteLength),
      format: "JPEG",
      quality: 1,
    });

    return Buffer.from(outputBuffer);
  } catch (error) {
    console.error("HEIC Conversion Error:", error);
    throw new Error("Failed to convert HEIC to JPEG");
  }
};


export const handlePhotoUpload = async (
  files: Express.Multer.File[] | Express.Multer.File,
  folder: string,
) => {
  if (!files) return null;
  const filesArray = Array.isArray(files) ? files : [files];
  if (filesArray.length === 0) return null;

  try {
    const uploadedIds: string[] = [];
    // Upload all files at once
    const uploadResults = await uploadFilesToS3(filesArray, folder);

    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      const uploadResult = uploadResults[i];
      const fileExtension = path.extname(file.originalname);

      const safeFileName =
        file.filename ||
        file.originalname.replace(/\s+/g, "_") ||
        `${Date.now()}-${fileExtension}`;

      const imagesHandle = new ImagesUpload({
        fileName: safeFileName,
        fileType: file.mimetype,
        fileExtension: fileExtension,
        fileSize: file.size,
        url: uploadResult.location,
        uploadDate: new Date(),
        key: uploadResult.key,
        //
        isPrimary: false,
      });

      await imagesHandle.save();
      uploadedIds.push(imagesHandle?._id?.toString() || "");
    }

    return uploadedIds;
  } catch (error) {
    console.error("Error during multiple file upload:", error);
    throw new Error("Multiple file upload failed");
  }
};
export const uploadFilesToS3 = async (
  files: Express.Multer.File[] | Express.Multer.File,
  folder: string
): Promise<
  Array<{
    filename: string;
    size: number;
    fileType: string;
    location: string;
    key: string;
  }>
> => {
  const filesArray = Array.isArray(files) ? files : [files];
  if (!filesArray.length) return [];

  const uploadResults = await Promise.all(
    filesArray.map(async (file) => {
      const key = `${folder}/${Date.now()}_${file.originalname}`;
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
        Body: file.buffer || fs.createReadStream(file.path),
        ContentType: file.mimetype,
        // ACL removed for compatibility
      };
      await s3Client.send(new PutObjectCommand(uploadParams));
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return {
        filename: file.originalname,
        size: file.size,
        fileType: file.mimetype,
        key: key,
        location: `https://${uploadParams.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      };
    })
  );

  return uploadResults;
};




export const deleteFile = async (keys: string | string[]) => {
  try {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    await Promise.all(
      keysArray.map(async (key) => {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: key,
          })
        );
      })
    );
  } catch (error) {
    console.log(error);
  }
};
