import jwt from "jsonwebtoken";
import { IUser } from "../interfaces/userInterface";
import Config from "../config/config";
import { setRedisClientToken } from "./redisUtils";
import { parseExpiryDuration } from "./helperUtils";

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "your-access-token-secret";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "your-refresh-token-secret";
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15d"; // Access token expiry time
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "30d"; // Refresh token expiry time
const REFRESH_TOKEN_EXPIRY_SECONDS = parseExpiryDuration(REFRESH_TOKEN_EXPIRY);
const ACCESS_TOKEN_EXPIRY_SECONDS = parseExpiryDuration(ACCESS_TOKEN_EXPIRY);

// export const signJWT = (
//   user: IUser,
//   tokenType: number,
//   callback: (error: Error | null, token: string | null) => void
// ): void => {
//   var tokenSecret = Config.server.token.secret;
//   let tokenExpire = process.env.REFRESH_TOKEN_EXPIRY || '90d'

//   if(tokenType == 1) {//access token
//     tokenExpire = process.env.ACCESS_TOKEN_EXPIRY || '7d'
//   }else if(tokenType == 2)
//     tokenExpire = process.env.REFRESH_TOKEN_EXPIRY || '90d'
//   try {
//     jwt.sign({ user: user, }, tokenSecret ,
//       {
//         issuer: Config.server.token.issuer,
//         algorithm: 'HS256',
//         expiresIn: '1d',
//       },
//       (error, token) => {
//         if (error) {
//           callback(error, null)
//         } else if (token) {
//           callback(null, token)
//         }
//       }
//     )
//   } catch (error) {
//   }
// }

// export const SignInToken = async (user: any, tokenType: number): Promise<string | Error> => {
//   return new Promise((resolve, reject) => {
//     signJWT(user, tokenType, (error: Error | null, token: string | null) => {
//       if (error) {
//         reject(error);
//       } else if (token) {
//         setRedisClientToken(token, user).catch(reject);
//         resolve(token);
//       }
//     });
//   });
// };

export const generateAccessToken = (userId: string ) => {
  console.log(userId, );
  const accessToken = jwt.sign({ userId,  }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  } as any);
  setRedisClientToken(accessToken, userId, ACCESS_TOKEN_EXPIRY_SECONDS);
  const accessTokenExpiry =
    Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRY_SECONDS;
  return { accessToken, accessTokenExpiry };
};

export const generateRefreshToken = (userId: string, ) => {
  console.log(userId, );
  const refreshToken = jwt.sign({ userId,  }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  } as any);
  setRedisClientToken(refreshToken, userId, REFRESH_TOKEN_EXPIRY_SECONDS);
  const refreshTokenExpiry =
    Math.floor(Date.now() / 1000) + REFRESH_TOKEN_EXPIRY_SECONDS;
  return { refreshToken, refreshTokenExpiry };
};

export function verifyAccessToken(token: string): any {
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
}

export function verifyRefreshToken(token: string): any {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
}
