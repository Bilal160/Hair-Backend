const MONGO_OPTIONS = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  socketTimeoutMS: 30000,
  autoIndex: true,
  retryWrites: true,
};

const MONGO_USERNAME = process.env.MONGO_USERNAME || "";
const MONGO_PASSWORD = process.env.MONGO_PASSWORD || "";
const MONGO_HOST = process.env.MONGO_HOST || "";

console.log(
  MONGO_USERNAME,
  MONGO_PASSWORD,
  MONGO_HOST,
  "MONGO_USERNAME, MONGO_PASSWORD, MONGO_HOST"
);

console.log(`mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}`);
// Use local MongoDB if no environment variables are set

const MONGO = {
  host: MONGO_HOST,
  password: MONGO_PASSWORD,
  username: MONGO_USERNAME,
  options: MONGO_OPTIONS,
  url:
    MONGO_USERNAME && MONGO_PASSWORD && MONGO_HOST
      ? `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}`
      : "mongodb://127.0.0.1:27017/roche_cgm",

  uri:
    MONGO_USERNAME && MONGO_PASSWORD && MONGO_HOST
      ? `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}`
      : "mongodb://127.0.0.1:27017/roche_cgm",
};

const SPORTMONKS_API = {
  baseUrl: process.env.SPORTMONKS_BASE_URL || "https://api.sportmonks.com",
  apiKey: process.env.SPORTMONKS_API_KEY || "mGItXeUWVfJtE012VS7S6k2UVJVaMTHqxDKvuQo5FYLSjXO6yFxw14yGi3Di",
  version: "v3",
  sport: "football"
};

const config = {
  mongo: MONGO,
  sportmonks: SPORTMONKS_API,
};

console.log(config, "config.mongo.uri");
export default config;
