// import * as dotenv from "dotenv";

// dotenv.config();

// import { mongoConnect } from "./src/config/dbConfig";
// import express, { NextFunction, Request, Response } from "express";
// import { createServer } from "http";
// import cors from "cors";

// import { routes } from "./src/routes/indexRoute";
// import { sendErrorResponse } from "./src/utils/responseUtils";
// import { asyncHandler } from "./src/utils/helperUtils";
// import { BusinessAuthController } from "./src/controllers/auth/businessAuthController";

// const app = express();
// app.use(
//   "/stripe/webhook",
//   express.raw({ type: "application/json" }),
//   asyncHandler(BusinessAuthController.handleStripeWebhook)
// );


// app.use(
//   cors({
//     origin: "*",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// const server = createServer(app);



// app.use("/api", routes());

// app.use((req: Request, res: Response, next: NextFunction) => {
//   sendErrorResponse(res, ["Resource not found"], 404);
// });

// mongoConnect()
//   .then((message) => {
//     console.log(message);
//   })
//   .catch((error) => {
//     console.error("Error occurred while connecting to MongoDB");
//     console.error(error);
//   });

// const port = process.env.PORT || 4000;
// server.listen(port, () => {
//   console.log(`Express app is running on port ${port}`);
// });
import * as dotenv from "dotenv";
dotenv.config();

import { mongoConnect } from "./src/config/dbConfig";
import express, { NextFunction, Request, Response } from "express";
import { createServer } from "http";
import cors from "cors";
import "./src/cronJobs/paymentCronJob";

import { routes } from "./src/routes/indexRoute";
import { sendErrorResponse } from "./src/utils/responseUtils";
import { asyncHandler } from "./src/utils/helperUtils";
import { BusinessAuthController } from "./src/controllers/auth/businessAuthController";

const app = express();
const server = createServer(app);

/* 
  ✅ Stripe Webhook — must be defined BEFORE express.json() or other parsers.
  ✅ No `/api` prefix here because Stripe expects the exact URL:
     https://hair-backend-production.up.railway.app/stripe/webhook
*/
app.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  asyncHandler(BusinessAuthController.handleStripeWebhook)
);

// ✅ Normal middleware (after webhook)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json()); // 👈 safe to add AFTER webhook route

// ✅ All your other routes
app.use("/api", routes());

// ✅ 404 handler
app.use((req: Request, res: Response) => {
  sendErrorResponse(res, ["Resource not found"], 404);
});

// ✅ Database connection
mongoConnect()
  .then((message) => console.log(message))
  .catch((error) => {
    console.error("Error occurred while connecting to MongoDB:", error);
  });

// ✅ Start server
const port = process.env.PORT || 4000;
server.listen(port, () => {
  console.log(`🚀 Express app is running on port ${port}`);
});
