import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { sendErrorResponse } from "../utils/responseUtils";
import { getRedisClientToken } from "../utils/redisUtils";

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "your-access-token-secret";

export const userAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    console.log(token, "Coming Token");

    if (!token) {
      sendErrorResponse(res, ["Authorization token is required"], 401);
      return;
    }

    const decoded = (await jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET || "your-access-token-secret"
    )) as any;

    const userToken = await getRedisClientToken(token);
    console.log(userToken, "userToken in userAuthMiddleware");
    if (!userToken) {
      sendErrorResponse(res, ["Unauthorized"], 401);
      return;
    }

    // More explicit validation
    if (!decoded) {
      console.log("Token validation failed - decoded is null/undefined");
      sendErrorResponse(res, ["Invalid token"], 401);
      return;
    }

    if (!decoded.userId) {
      console.log("Token validation failed - userId is missing");
      sendErrorResponse(res, ["Invalid token"], 401);
      return;
    }

  

    (req as any).userId = decoded.userId;
 
    (req as any).token = token;

    console.log("Token validation successful, proceeding...");
    next();
  } catch (error) {
    console.error("User Auth Middleware Error:", error);
    sendErrorResponse(res, ["Invalid or expired token"], 401);
    return;
  }
};
