

import { ImagesUpload } from "../models/profilePhoto"
import { deleteFile } from "../utils/imagesUtils"
;

export class ImagesService {
  constructor(private readonly imageService: ImagesService) {}


 static async getPhotoById( photoId: string) {
    try {
      const photo = await ImagesUpload.findOne({
        _id: photoId,
      });
      return photo;
    } catch (error) {
      throw new Error("Photo not found or error occurred");
    }
  }

  static async deletePhotoById(photoId: string,key:string) {
  try {
    const deletedPhoto = await ImagesUpload.findOneAndDelete({
      _id: photoId,
    });

    await deleteFile(key);
    return deletedPhoto;
  } catch (error) {
    throw new Error("Photo could not be deleted or error occurred");
  }
}

static async handleDeletions(ids: string[] | string | undefined) {
  if (!ids) return;
  const idArray = Array.isArray(ids) ? ids : [ids];
  for (const id of idArray) {
    const photo = await ImagesUpload.findById(id);
    if (photo) {
      await ImagesUpload.findByIdAndDelete(id);
      await deleteFile(photo.key);
    }
  }
}


}
