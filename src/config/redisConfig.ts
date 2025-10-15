import { Redis } from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redisClient = new Redis(redisUrl);

redisClient.on("connect", () => {
  console.log(`✅ Redis connected to ${redisUrl}`);
});

redisClient.on("error", (err) => {
  console.error("❌ Redis connection error:", err.message);
});

export default redisClient;

