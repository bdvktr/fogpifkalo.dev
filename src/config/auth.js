import "./env.js";
export const JWT_SECRET =
  process.env.JWT_SECRET || "nagyon-titkos-jwt-jelszo-csereld-ki";

//access / refresh token konfiguráció

export const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || JWT_SECRET;

export const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || JWT_SECRET;

export const ACCESS_TOKEN_EXPIRES_IN =
  process.env.ACCESS_TOKEN_EXPIRES_IN || "20s";

export const REFRESH_TOKEN_EXPIRES_IN =
  process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

export const ACCESS_TOKEN_COOKIE_NAME = "access_token";
export const REFRESH_TOKEN_COOKIE_NAME = "refresh_token";

export const ACCESS_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 20 * 1000,
};

export const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 nap
};

export const SALT_ROUNDS = 10;
