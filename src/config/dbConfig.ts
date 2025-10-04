import * as mongoose from "mongoose";
import { resolve } from "path";
import Config from "./config";

// Load environment variables from the project root (outside dist folder)

/** Connect to Mongo */
//hede

let mongoURL = "";
if (process.env.NODE_ENV === "development") mongoURL = Config.mongo.uri;
else mongoURL = Config.mongo.url;

export const mongoConnect = async () => {
  try {
    const result = await mongoose.connect(mongoURL, Config.mongo.options);
    return "Mongo connected on " + mongoURL;
  } catch (error) {
    throw error;
  }
};
