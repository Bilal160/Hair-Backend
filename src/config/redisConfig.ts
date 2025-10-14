// import { Redis } from "ioredis";

// const redisClient = new Redis({
//   host: process.env.REDIS_HOST || "127.0.0.1",
//   port: Number(process.env.REDIS_PORT) || 6379,
//   password: process.env.REDIS_PASSWORD || undefined,
//   // enable only if needed
// });

// redisClient.on("connect", () => {
//   console.log(
//     `✅ Redis connected to ${process.env.REDIS_HOST ? "remote host" : "local instance"}`
//   );
// });

// redisClient.on("error", (err) => {
//   console.error("❌ Redis connection error:", err.message);
// });

// export default redisClient;
