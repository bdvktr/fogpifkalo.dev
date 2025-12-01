export const JWT_SECRET =
  process.env.JWT_SECRET || "nagyon-titkos-jwt-jelszo-csereld-ki";

export const JWT_COOKIE_NAME = "auth_token";

export const JWT_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const SALT_ROUNDS = 10;
