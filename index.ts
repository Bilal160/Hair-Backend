import * as dotenv from "dotenv";
dotenv.config();

import { mongoConnect } from "./src/config/dbConfig";
import express, { NextFunction, Request, Response } from "express";
import { createServer } from "http";
import cors from "cors";

import { routes } from "./src/routes/indexRoute";
import { sendErrorResponse } from "./src/utils/responseUtils";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const server = createServer(app);

app.use("/api", routes());

app.use((req: Request, res: Response, next: NextFunction) => {
  sendErrorResponse(res, ["Resource not found"], 404);
});

mongoConnect()
  .then((message) => {
    console.log(message);
  })
  .catch((error) => {
    console.error("Error occurred while connecting to MongoDB");
    console.error(error);
  });

const port = process.env.PORT || 4000;
server.listen(port, () => {
  console.log(`Express app is running on port ${port}`);
});
