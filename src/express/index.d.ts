import { User } from "../interfaces/userInterface";

declare global {
  namespace Express {
    interface Request {
      userId: User;
      roleType: number;
      token: string;
      files?: {
        logoPhoto?: Express.Multer.File[];
        bannerPhoto?: Express.Multer.File[];
      };
    }
  }
}
