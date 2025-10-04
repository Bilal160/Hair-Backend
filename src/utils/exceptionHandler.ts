import { Request, Response, NextFunction } from "express";
import { sendErrorResponse } from "./responseUtils"; // Adjust the import path as necessary

// Define a custom error interface for better type safety
interface CustomError extends Error {
  status?: number;
}

// Generic error handler middleware
export const exceptionHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error (you can use a logger library like Winston or Morgan)
  console.error(err);

  // Set default status code to 500 for server errors
  const statusCode = err.status || 500;

  // Use the sendErrorResponse utility function
  sendErrorResponse(
    res,
    [err.message || "An unexpected error occurred"],
    statusCode
  );
};
