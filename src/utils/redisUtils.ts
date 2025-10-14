import Redis, {  RedisKey } from "ioredis";

const redisClient = new Redis();

export const setRedisClientToken = async (
  token: RedisKey,
  userId: string,
  expiresIn: number
): Promise<void> => {
  console.log(
    token,
    userId,
    expiresIn,
    "token, userId, expiresIn in setRedisClientToken"
  );
  let result = await redisClient.set(token, userId, "EX", expiresIn);
};

export const getRedisClientToken: (
  token: RedisKey
) => Promise<boolean> = async (token) => {
  const tokenCheck = await redisClient.get(token as RedisKey);
  if (tokenCheck == null) return false;
  else return true;
};

export const getRedisClientTokenDetail: (
  token: RedisKey
) => Promise<string | null> = async (token) => {
  const details = await redisClient.get(token as RedisKey);
  if (details === null) {
    return null; // Handle null if the key doesn't exist in Redis
  }

  // Convert the string result to a Mongoose ObjectId
  return details;
};

export const destroyRedisClientToken: (
  token: RedisKey
) => Promise<void> = async (token) => {
  console.log(token, "token in destroyRedisClientToken");
  const result = await redisClient.del(token as RedisKey);
  console.log(result, "result in destroyRedisClientToken");
};

export const destroyRedisClientTokenByUserId = async (
  userId: string
): Promise<void> => {
  console.log("destroy client called");
  let cursor = "0";

  do {
    const [newCursor, keys] = await redisClient.scan(
      cursor,
      "MATCH",
      "*",
      "COUNT",
      100
    );
    cursor = newCursor;

    for (const key of keys) {
      const storedUserId = await redisClient.get(key);

      if (storedUserId === userId) {
        await redisClient.del(key);
      }
    }
  } while (cursor !== "0"); // Jab tak cursor 0 nahi ho jata, SCAN chalta rahega
};
