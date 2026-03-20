import "../../env.js";
import jwt from "jsonwebtoken";

const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_TTL || "15m";
const REFRESH_TOKEN_TTL = process.env.JWT_REFRESH_TTL || "30d";

function getEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function signAccessToken(payload) {
  return jwt.sign(payload, getEnv("JWT_ACCESS_SECRET"), {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, getEnv("JWT_REFRESH_SECRET"), {
    expiresIn: REFRESH_TOKEN_TTL,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, getEnv("JWT_ACCESS_SECRET"));
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, getEnv("JWT_REFRESH_SECRET"));
}
