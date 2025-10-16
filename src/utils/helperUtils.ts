import * as bcryptjs from "bcryptjs";

import { RequestHandler, Request, Response, NextFunction } from "express";

const PasswordEncrypt = async (password: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    bcryptjs.hash(password, 10, (hashError, hash) => {
      if (hashError) {
        reject(hashError);
      } else {
        resolve(hash || "");
      }
    });
  });
};

export const PasswordMatch = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    const isMatch = await bcryptjs.compare(password, hashedPassword);

    console.log(isMatch);
    return isMatch;
  } catch (error) {
    console.log(error);
    return false;
  }
};

function generateToken() {
  // Generate a random number between 1000 and 9999
  //const token = Math.floor(Math.random() * 9000) + 1000;
  const token = Math.floor(Math.random() * 900000) + 100000;

  return token;
}

function generateTokenForOTp() {
  // Generate a random 4-digit number between 1000 and 9999
  const token = Math.floor(Math.random() * 9000) + 1000;
  return token;
}

export const ComparePassword = async (
  newPassword: string,
  oldPassword: string
): Promise<boolean> => {
  try {
    // Await the bcrypt comparison directly
    const isSamePassword = await bcryptjs.compare(newPassword, oldPassword);
    return isSamePassword;
  } catch (error) {
    throw new Error("Error comparing passwords " + error);
  }
};

// Utility function to parse duration string
function parseExpiryDuration(duration: string): number {
  const match = duration.match(/^(\d+)([d|h|m|s])$/);
  if (!match) throw new Error("Invalid duration format");

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "d":
      return value * 24 * 60 * 60; // days to seconds
    case "h":
      return value * 60 * 60; // hours to seconds
    case "m":
      return value * 60; // minutes to seconds
    case "s":
      return value; // seconds
    default:
      throw new Error("Unknown time unit");
  }
}

export {
  PasswordEncrypt,
  generateToken,
  parseExpiryDuration,
  generateTokenForOTp,
};

export const handleValidationErrors = (error: any): string => {
  console.log(error, "error in handleValidationErrors");
  const errorFlatten = error.flatten();

  const fieldErrors = errorFlatten.fieldErrors || {};
  const formErrors = errorFlatten.formErrors || [];

  // Get the first error message
  const firstFieldError = Object.values(fieldErrors).flat()[0];
  const firstFormError = formErrors[0];

  // Return the most specific error message
  return firstFieldError || firstFormError || "Validation failed";
};

export const asyncHandler =
  (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
  ): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
