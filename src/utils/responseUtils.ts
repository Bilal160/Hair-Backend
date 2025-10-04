import { Response } from "express";
import { BaseModel } from "../models/baseModel";

export const sendSuccessResponse = <T>(
  res: Response,
  message: string[],
  data: T,
  statusCode: number = 200
) => {
  const response = new BaseModel(message, statusCode, data);
  return res.status(statusCode).json(response);
};

export const sendErrorResponse = (
  res: Response,
  message: string[],
  statusCode: number = 400,
  data: any = {}
) => {
  const response = new BaseModel(message, statusCode, data);
  return res.status(statusCode).json(response);
};

export function generateAnchorTags(links: any) {
  if (!links) return "";

  if (Array.isArray(links)) {
    return links
      .map((link) => `<a href="${encodeURI(link)}" target="_blank">${link}</a>`)
      .join("\n");
  }

  return `<a href="${encodeURI(links)}" target="_blank">${links}</a>`;
}
